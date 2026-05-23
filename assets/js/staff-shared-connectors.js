export class StaffSharedConnectors {
  constructor(root) {
    this.root = root;
    this.resizeObserver = null;
    this.connectorThickness = 2;
    this.horizontalColor = "rgba(216, 187, 121, 0.32)";
    this.verticalColor = "rgba(216, 187, 121, 0.34)";
    this.handleResize = this.handleResize.bind(this);
  }

  mount() {
    if (!this.root) {
      return;
    }

    this.layout();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.layout();
      });
    });

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.root);
    } else {
      window.addEventListener("resize", this.handleResize);
    }
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize() {
    this.layout();
  }

  layout() {
    const anchors = this.root?.querySelectorAll("[data-staff-shared-anchor]") ?? [];
    anchors.forEach((anchor) => this.layoutAnchor(anchor));
  }

  layoutAnchor(anchor) {
    const overlay = anchor.querySelector(":scope > [data-staff-shared-overlay]");
    const sharedRow = anchor.querySelector(":scope > .staff-node__shared-zone > [data-staff-shared-row]");

    if (!(overlay instanceof SVGElement) || !(sharedRow instanceof HTMLElement)) {
      return;
    }

    const sharedNodes = [
      ...sharedRow.querySelectorAll(":scope > .staff-node[data-shared-parents]"),
    ];

    if (!sharedNodes.length) {
      overlay.innerHTML = "";
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const width = Math.max(anchorRect.width, 1);
    const height = Math.max(anchorRect.height, 1);
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", "100%");
    overlay.setAttribute("height", "100%");
    overlay.setAttribute("preserveAspectRatio", "none");

    const groups = new Map();

    sharedNodes.forEach((sharedNode) => {
      const parentIds = (sharedNode.dataset.sharedParents ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (parentIds.length < 2) {
        return;
      }

      const groupKey = parentIds.join("|");
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          parentIds,
          sharedNodes: [],
        });
      }

      groups.get(groupKey).sharedNodes.push(sharedNode);
    });

    const markup = [];

    groups.forEach((group) => {
      const parentPoints = group.parentIds
        .map((parentId) =>
          anchor.querySelector(
            `[data-staff-node-trigger][data-staff-node-id="${parentId}"]`,
          ),
        )
        .filter(Boolean)
        .map((button) => this.measureCard(button, anchorRect));

      const childPoints = group.sharedNodes
        .map((sharedNode) =>
          sharedNode.querySelector(":scope > [data-staff-node-trigger]"),
        )
        .filter(Boolean)
        .map((button) => this.measureCard(button, anchorRect));

      if (parentPoints.length < 2 || !childPoints.length) {
        return;
      }

      const maxParentBottom = Math.max(...parentPoints.map((point) => point.bottom));
      const minChildTop = Math.min(...childPoints.map((point) => point.top));
      const parentGap = 14;
      const childGap = 56;
      const proposedBusY = minChildTop - childGap;
      const minimumBusY = maxParentBottom + parentGap;
      const busY = Math.round(Math.max(proposedBusY, minimumBusY));
      const halfThickness = this.connectorThickness / 2;
      const parentStemEndY = busY - halfThickness;
      const childStemStartY = busY + halfThickness;

      const childCenters = childPoints.map((point) => point.centerX);
      const parentCenters = parentPoints.map((point) => point.centerX);
      const busStartX =
        childCenters.length > 1 ? Math.min(...childCenters) : Math.min(...parentCenters);
      const busEndX =
        childCenters.length > 1 ? Math.max(...childCenters) : Math.max(...parentCenters);

      markup.push(this.createHorizontalSegment(busStartX, busEndX, busY));

      parentPoints.forEach((point) => {
        markup.push(
          this.createVerticalSegment(point.centerX, point.bottom, parentStemEndY),
        );
      });

      childPoints.forEach((point) => {
        markup.push(
          this.createVerticalSegment(point.centerX, childStemStartY, point.top),
        );
      });
    });

    overlay.innerHTML = markup.join("");
  }

  measureCard(button, anchorRect) {
    const rect = button.getBoundingClientRect();

    return {
      centerX: rect.left - anchorRect.left + rect.width / 2,
      bottom: rect.bottom - anchorRect.top,
      top: rect.top - anchorRect.top,
    };
  }

  createHorizontalSegment(x1, x2, y) {
    const startX = Math.round(Math.min(x1, x2));
    const endX = Math.round(Math.max(x1, x2));
    const snappedY = Math.round(y - this.connectorThickness / 2);
    const width = Math.max(endX - startX, this.connectorThickness);

    return `<rect x="${startX}" y="${snappedY}" width="${width}" height="${this.connectorThickness}" fill="${this.horizontalColor}" shape-rendering="crispEdges" />`;
  }

  createVerticalSegment(x, y1, y2) {
    const snappedX = Math.round(x - this.connectorThickness / 2);
    const startY = Math.round(Math.min(y1, y2));
    const endY = Math.round(Math.max(y1, y2));
    const height = Math.max(endY - startY, this.connectorThickness);

    return `<rect x="${snappedX}" y="${startY}" width="${this.connectorThickness}" height="${height}" fill="${this.verticalColor}" shape-rendering="crispEdges" />`;
  }
}
