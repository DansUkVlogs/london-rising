import { toAssetUrl, toCssImageUrl } from "./asset-url.js?v=20260523r";
import { buildStyleAttribute } from "./style-utils.js?v=20260523r";
import { StaffProfileModal } from "./staff-profile-modal.js?v=20260523r";
import { StaffChartViewport } from "./staff-chart-viewport.js?v=20260523r";
import { StaffSharedConnectors } from "./staff-shared-connectors.js?v=20260523r";

export class StaffStructurePageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.profileModal = new StaffProfileModal();
    this.chartViewport = null;
    this.sharedConnectors = null;
    this.profileMap = new Map();
    this.fallbackProfileImage = "";
    this.handleRootClick = this.handleRootClick.bind(this);
  }

  async mount() {
    if (!this.root) {
      return;
    }

    const { hero, structure: rawStructure } = await this.dataLoader.loadNamed({
      hero: `${this.route.dataFolder}/hero.json`,
      structure: `${this.route.dataFolder}/structure.json`,
    });

    const structure = this.normalizeStructureConfig(rawStructure);
    this.profileMap = this.buildProfileMap(structure.nodes ?? []);
    this.fallbackProfileImage = structure.fallbackProfileImage ?? "";

    this.applyHeroSettings(hero);
    this.render(hero, structure);
    this.profileModal.mount();
    this.chartViewport = new StaffChartViewport(this.root);
    this.chartViewport.mount();
    this.sharedConnectors = new StaffSharedConnectors(this.root);
    this.sharedConnectors.mount();
    this.root.addEventListener("click", this.handleRootClick);
  }

  destroy() {
    this.root?.removeEventListener("click", this.handleRootClick);
    this.chartViewport?.destroy();
    this.chartViewport = null;
    this.sharedConnectors?.destroy();
    this.sharedConnectors = null;
    this.profileModal.destroy();
  }

  handleRootClick(event) {
    const trigger = event.target.closest("[data-staff-node-trigger]");
    if (!trigger) {
      return;
    }

    const profile = this.profileMap.get(trigger.dataset.staffNodeId);
    if (!profile) {
      return;
    }

    this.profileModal.open(profile, this.fallbackProfileImage);
  }

  applyHeroSettings(heroConfig = {}) {
    if (heroConfig.backgroundImage) {
      this.root.style.setProperty("--staff-hero-image", toCssImageUrl(heroConfig.backgroundImage));
    } else {
      this.root.style.removeProperty("--staff-hero-image");
    }

    if (heroConfig.backgroundPosition) {
      this.root.style.setProperty("--staff-hero-position", heroConfig.backgroundPosition);
    } else {
      this.root.style.removeProperty("--staff-hero-position");
    }
  }

  buildProfileMap(nodes, map = new Map()) {
    nodes.forEach((node) => {
      map.set(node.id, node);
      if (node.children?.length) {
        this.buildProfileMap(node.children, map);
      }
      if (node.sharedChildren?.length) {
        this.buildProfileMap(node.sharedChildren, map);
      }
    });

    return map;
  }

  normalizeStructureConfig(rawStructure = {}) {
    const sectionConfig =
      rawStructure.section ??
      rawStructure.header ??
      rawStructure.overview ??
      rawStructure.meta ??
      {};

    const chartConfig =
      rawStructure.chart ??
      rawStructure.hierarchy ??
      rawStructure.tree ??
      rawStructure.structure ??
      {};

    const profileConfig =
      rawStructure.profile ??
      rawStructure.profiles ??
      rawStructure.fallbacks ??
      {};

    return {
      sectionLabel:
        rawStructure.sectionLabel ??
        sectionConfig.label ??
        sectionConfig.eyebrow ??
        "Staff hierarchy",
      sectionTitle:
        rawStructure.sectionTitle ??
        sectionConfig.title ??
        sectionConfig.heading ??
        "Chain of command",
      sectionDescription:
        rawStructure.sectionDescription ??
        sectionConfig.description ??
        sectionConfig.copy ??
        "This chart shows the staff hierarchy structure.",
      helperText:
        rawStructure.helperText ??
        rawStructure.badgeLabel ??
        chartConfig.helperText ??
        chartConfig.badgeLabel ??
        "Click a profile for full details",
      fallbackProfileImage:
        rawStructure.fallbackProfileImage ??
        profileConfig.fallbackProfileImage ??
        profileConfig.fallbackImage ??
        profileConfig.defaultImage ??
        "",
      nodes: this.buildHierarchyNodes(
        rawStructure.nodes ??
          chartConfig.nodes ??
          chartConfig.roots ??
          chartConfig.items ??
          rawStructure.roots ??
          rawStructure.items ??
          [],
        rawStructure.rootIds ?? chartConfig.rootIds ?? chartConfig.rootNodes ?? rawStructure.rootNodes ?? [],
      ),
    };
  }

  buildHierarchyNodes(rawNodes, preferredRoots = []) {
    if (!Array.isArray(rawNodes)) {
      return [];
    }

    if (!rawNodes.some((node) => this.hasReferencedChildren(node))) {
      return this.normalizeNodes(rawNodes);
    }

    const normalizedFlatNodes = rawNodes
      .map((node, index) => this.normalizeFlatNode(node, index))
      .filter(Boolean);

    const nodeMap = new Map(normalizedFlatNodes.map((node) => [node.id, node]));
    const parentRefs = new Map();

    normalizedFlatNodes.forEach((node) => {
      node.childRefs.forEach((childId) => {
        if (!parentRefs.has(childId)) {
          parentRefs.set(childId, new Set());
        }
        parentRefs.get(childId).add(node.id);
      });
    });

    normalizedFlatNodes.forEach((node) => {
      node.sharedParents.forEach((parentId) => {
        const parent = nodeMap.get(parentId);
        if (parent && !parent.childRefs.includes(node.id)) {
          parent.childRefs.push(node.id);
        }
      });
    });

    normalizedFlatNodes.forEach((node) => {
      if (node.sharedParents.length < 2) {
        return;
      }

      const anchorId = this.resolveSharedAnchor(node.sharedParents, parentRefs);
      if (!anchorId) {
        return;
      }

      normalizedFlatNodes.forEach((candidate) => {
        candidate.childRefs = candidate.childRefs.filter((childId) => childId !== node.id);
      });

      const anchorNode = nodeMap.get(anchorId);
      if (anchorNode && !anchorNode.sharedChildRefs.includes(node.id)) {
        anchorNode.sharedChildRefs.push(node.id);
      }
    });

    const referencedIds = new Set();
    normalizedFlatNodes.forEach((node) => {
      node.childRefs.forEach((childId) => {
        if (nodeMap.has(childId)) {
          referencedIds.add(childId);
        }
      });
      node.sharedChildRefs.forEach((childId) => {
        if (nodeMap.has(childId)) {
          referencedIds.add(childId);
        }
      });
    });

    const rootIds = Array.isArray(preferredRoots) && preferredRoots.length
      ? preferredRoots.filter((rootId) => nodeMap.has(rootId))
      : normalizedFlatNodes
          .filter((node) => !referencedIds.has(node.id))
          .map((node) => node.id);

    return rootIds
      .map((rootId) => this.materializeNodeTree(rootId, nodeMap, new Set()))
      .filter(Boolean);
  }

  hasReferencedChildren(node) {
    if (!node || typeof node !== "object") {
      return false;
    }

    const childSource = node.children ?? node.nodes ?? node.reports ?? node.members ?? node.team ?? [];
    const sharedParents = node.sharedParents ?? node.parents ?? [];

    return (
      childSource.some((child) => typeof child === "string") ||
      sharedParents.some((parentId) => typeof parentId === "string")
    );
  }

  normalizeNodes(nodes) {
    if (!Array.isArray(nodes)) {
      return [];
    }

    return nodes.map((node, index) => this.normalizeNode(node, index)).filter(Boolean);
  }

  normalizeFlatNode(node, index = 0) {
    const normalizedNode = this.normalizeNode(node, index);
    if (!normalizedNode) {
      return null;
    }

    const childSource = node.children ?? node.nodes ?? node.reports ?? node.members ?? node.team ?? [];
    const sharedParentSource = node.sharedParents ?? node.parents ?? [];

    return {
      ...normalizedNode,
      childRefs: childSource.filter((child) => typeof child === "string"),
      sharedChildRefs: [],
      sharedParents: sharedParentSource.filter((parentId) => typeof parentId === "string"),
      children: [],
      sharedChildren: [],
    };
  }

  normalizeNode(node, index = 0) {
    if (!node || typeof node !== "object") {
      return null;
    }

    const childSource = node.children ?? node.nodes ?? node.reports ?? node.members ?? node.team ?? [];
    const name = node.name ?? node.title ?? node.label ?? "Unassigned";
    const summary = node.summary ?? node.description ?? node.blurb ?? "";

    return {
      id: node.id ?? node.key ?? node.slug ?? `staff-node-${index}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      role: node.role ?? node.subtitle ?? node.position ?? node.department ?? "",
      summary,
      fullDescription: node.fullDescription ?? node.longDescription ?? node.body ?? summary,
      image: node.image ?? node.profileImage ?? node.avatar ?? node.photo ?? "",
      sectionCard: Boolean(node.sectionCard ?? node.sectionCards),
      accentColor: node.accentColor ?? node.accent ?? node.color ?? "",
      children: this.normalizeNodes(childSource),
      sharedChildren: [],
      sharedParents: [],
    };
  }

  materializeNodeTree(nodeId, nodeMap, trail) {
    if (trail.has(nodeId)) {
      return null;
    }

    const baseNode = nodeMap.get(nodeId);
    if (!baseNode) {
      return null;
    }

    const nextTrail = new Set(trail);
    nextTrail.add(nodeId);

    return {
      ...baseNode,
      children: baseNode.childRefs
        .map((childId) => this.materializeNodeTree(childId, nodeMap, nextTrail))
        .filter(Boolean),
      sharedChildren: baseNode.sharedChildRefs
        .map((childId) => this.materializeNodeTree(childId, nodeMap, nextTrail))
        .filter(Boolean),
    };
  }

  resolveSharedAnchor(sharedParents, parentRefs) {
    const validParents = sharedParents.filter((parentId) => typeof parentId === "string");
    if (validParents.length < 2) {
      return validParents[0] ?? null;
    }

    const ancestorMaps = validParents.map((parentId) => this.collectAncestorDistances(parentId, parentRefs));
    const candidateIds = [...ancestorMaps[0].keys()].filter((candidateId) =>
      ancestorMaps.every((ancestorMap) => ancestorMap.has(candidateId)),
    );

    if (!candidateIds.length) {
      return null;
    }

    candidateIds.sort((leftId, rightId) => {
      const leftDistances = ancestorMaps.map((ancestorMap) => ancestorMap.get(leftId) ?? Number.POSITIVE_INFINITY);
      const rightDistances = ancestorMaps.map((ancestorMap) => ancestorMap.get(rightId) ?? Number.POSITIVE_INFINITY);
      const leftMax = Math.max(...leftDistances);
      const rightMax = Math.max(...rightDistances);

      if (leftMax !== rightMax) {
        return leftMax - rightMax;
      }

      const leftTotal = leftDistances.reduce((sum, value) => sum + value, 0);
      const rightTotal = rightDistances.reduce((sum, value) => sum + value, 0);
      return leftTotal - rightTotal;
    });

    return candidateIds[0] ?? null;
  }

  collectAncestorDistances(nodeId, parentRefs, distances = new Map(), depth = 0) {
    const currentDistance = distances.get(nodeId);
    if (currentDistance !== undefined && currentDistance <= depth) {
      return distances;
    }

    distances.set(nodeId, depth);

    const parents = parentRefs.get(nodeId);
    if (!parents?.size) {
      return distances;
    }

    parents.forEach((parentId) => {
      this.collectAncestorDistances(parentId, parentRefs, distances, depth + 1);
    });

    return distances;
  }

  buildNodeStyle(node) {
    return buildStyleAttribute({
      "--staff-node-accent": node.accentColor,
    });
  }

  getProfileImage(imagePath) {
    return toAssetUrl(imagePath || this.fallbackProfileImage);
  }

  renderNode(node) {
    const childMarkup = (node.children ?? []).map((child) => this.renderNode(child)).join("");
    const sharedMarkup = (node.sharedChildren ?? []).map((child) => this.renderNode(child)).join("");
    const roleMarkup = node.role ? `<span class="staff-node__role">${node.role}</span>` : "";
    const summaryMarkup = node.summary ? `<span class="staff-node__summary">${node.summary}</span>` : "";
    const cardClasses = ["staff-node__card"];
    const avatarMarkup = node.sectionCard
      ? ""
      : `
          <span class="staff-node__avatar">
            <img src="${this.getProfileImage(node.image)}" alt="${node.name} profile picture" />
          </span>
        `;

    if (node.sectionCard) {
      cardClasses.push("staff-node__card--section");
    }

    const nodeAttributes = [
      `class="staff-node"`,
      `data-staff-tree-node="${node.id}"`,
    ];

    if (node.sharedChildren?.length) {
      nodeAttributes.push(`data-staff-shared-anchor`);
    }

    if (node.sharedParents?.length) {
      nodeAttributes.push(`data-shared-parents="${node.sharedParents.join(",")}"`);
    }

    return `
      <div ${nodeAttributes.join(" ")}>
        <button
          class="${cardClasses.join(" ")}"
          type="button"
          data-staff-node-trigger
          data-staff-node-id="${node.id}"
          ${this.buildNodeStyle(node)}
          aria-label="Open profile for ${node.name}"
        >
          ${node.sectionCard ? '<span class="staff-node__badge">Section</span>' : ""}
          ${avatarMarkup}
          <span class="staff-node__content">
            <strong class="staff-node__name">${node.name}</strong>
            ${roleMarkup}
            ${summaryMarkup}
          </span>
        </button>

        ${childMarkup ? `<div class="staff-node__children">${childMarkup}</div>` : ""}
        ${
          sharedMarkup
            ? `
              <svg class="staff-node__shared-overlay" data-staff-shared-overlay aria-hidden="true"></svg>
              <div class="staff-node__shared-zone">
                <div class="staff-node__shared-row" data-staff-shared-row>${sharedMarkup}</div>
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  render(hero, structure) {
    this.root.innerHTML = `
      <header class="section-hero section-hero--staff" data-reveal data-hero-trail>
        <p class="section-hero__eyebrow">${hero.eyebrow}</p>
        <h1 class="section-hero__title">${hero.title}</h1>
        <p class="section-hero__copy">${hero.description}</p>
      </header>

      <section class="staff-chart-section" data-reveal>
        <div class="section-heading">
          <div>
            <p class="section-label">${structure.sectionLabel}</p>
            <h2 class="section-title">${structure.sectionTitle}</h2>
          </div>
          <span class="pill pill--outlined">${structure.helperText}</span>
        </div>

        <p class="staff-chart-section__copy">${structure.sectionDescription}</p>

        <div class="staff-chart-canvas" data-staff-chart-canvas>
          <div class="staff-chart-canvas__inner" data-staff-chart-inner>
            <div class="staff-chart" data-staff-chart>
              ${(structure.nodes ?? []).map((node) => this.renderNode(node)).join("")}
            </div>
          </div>

          <div class="staff-chart-canvas__controls" data-staff-chart-controls>
            <button class="staff-chart-zoom-btn" type="button" data-staff-zoom-in aria-label="Zoom in">+</button>
            <button class="staff-chart-zoom-btn" type="button" data-staff-zoom-out aria-label="Zoom out">-</button>
          </div>
        </div>
      </section>
    `;
  }
}
