export class StaffChartViewport {
  constructor(root) {
    this.root = root;
    this.canvas = root?.querySelector("[data-staff-chart-canvas]") ?? null;
    this.inner = root?.querySelector("[data-staff-chart-inner]") ?? null;
    this.chart = root?.querySelector("[data-staff-chart]") ?? null;
    this.zoomInButton = root?.querySelector("[data-staff-zoom-in]") ?? null;
    this.zoomOutButton = root?.querySelector("[data-staff-zoom-out]") ?? null;
    this.resizeObserver = null;

    this.tx = 0;
    this.ty = 0;
    this.scale = 1;
    this.minScale = 0.28;
    this.maxScale = 1.8;
    this.dragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startTx = 0;
    this.startTy = 0;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleZoomIn = this.handleZoomIn.bind(this);
    this.handleZoomOut = this.handleZoomOut.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  mount() {
    if (!this.canvas || !this.inner || !this.chart) {
      return;
    }

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.zoomInButton?.addEventListener("click", this.handleZoomIn);
    this.zoomOutButton?.addEventListener("click", this.handleZoomOut);

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.canvas);
    } else {
      window.addEventListener("resize", this.handleResize);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.fitView();
      });
    });
  }

  destroy() {
    this.canvas?.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this.canvas?.removeEventListener("wheel", this.handleWheel);
    this.zoomInButton?.removeEventListener("click", this.handleZoomIn);
    this.zoomOutButton?.removeEventListener("click", this.handleZoomOut);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize() {
    this.fitView();
  }

  handlePointerDown(event) {
    if (!this.canvas) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("[data-staff-node-trigger], [data-staff-chart-controls]")) {
      return;
    }

    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTx = this.tx;
    this.startTy = this.ty;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.canvas.classList.add("is-dragging");
    event.preventDefault();
  }

  handlePointerMove(event) {
    if (!this.dragging) {
      return;
    }

    this.tx = this.startTx + (event.clientX - this.startX);
    this.ty = this.startTy + (event.clientY - this.startY);
    this.applyTransform();
  }

  handlePointerUp(event) {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;
    this.canvas?.releasePointerCapture?.(event.pointerId);
    this.canvas?.classList.remove("is-dragging");
  }

  handleWheel(event) {
    if (!this.canvas) {
      return;
    }

    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const previousScale = this.scale;
    const nextScale = this.clamp(this.scale - event.deltaY * 0.001, this.minScale, this.maxScale);

    if (nextScale === previousScale) {
      return;
    }

    const ratio = nextScale / previousScale;
    this.scale = nextScale;
    this.tx = mouseX - ratio * (mouseX - this.tx);
    this.ty = mouseY - ratio * (mouseY - this.ty);
    this.applyTransform();
  }

  handleZoomIn() {
    this.zoomBy(0.15);
  }

  handleZoomOut() {
    this.zoomBy(-0.15);
  }

  zoomBy(delta) {
    if (!this.canvas) {
      return;
    }

    const previousScale = this.scale;
    const nextScale = this.clamp(this.scale + delta, this.minScale, this.maxScale);
    if (nextScale === previousScale) {
      return;
    }

    const mouseX = this.canvas.clientWidth / 2;
    const mouseY = this.canvas.clientHeight / 2;
    const ratio = nextScale / previousScale;
    this.scale = nextScale;
    this.tx = mouseX - ratio * (mouseX - this.tx);
    this.ty = mouseY - ratio * (mouseY - this.ty);
    this.applyTransform();
  }

  fitView() {
    if (!this.canvas || !this.chart) {
      return;
    }

    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = this.canvas.clientHeight;
    const chartWidth = this.chart.offsetWidth;
    const chartHeight = this.chart.offsetHeight;
    const padding = 28;

    if (!canvasWidth || !canvasHeight || !chartWidth || !chartHeight) {
      return;
    }

    this.scale = Math.min((canvasWidth - padding * 2) / chartWidth, (canvasHeight - padding * 2) / chartHeight, 1);
    this.scale = this.clamp(this.scale, this.minScale, this.maxScale);
    this.tx = (canvasWidth - chartWidth * this.scale) / 2;
    this.ty = Math.max((canvasHeight - chartHeight * this.scale) / 2, padding);
    this.applyTransform();
  }

  applyTransform() {
    if (!this.inner) {
      return;
    }

    this.inner.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}
