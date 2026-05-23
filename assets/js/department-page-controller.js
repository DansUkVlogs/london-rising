import { toCssImageUrl } from "./asset-url.js?v=20260523c";
import { buildLinkAttributes } from "./link-utils.js?v=20260523c";

export class DepartmentPageController {
  constructor(root, departmentKey, dataLoader, route) {
    this.root = root;
    this.departmentKey = departmentKey;
    this.dataLoader = dataLoader;
    this.route = route;
    this._escListener = null;
    this._modalEl = null;
  }

  async mount() {
    if (!this.root) return;

    let pageConfig, divisions, requirements, progression, values;

    try {
      [pageConfig, divisions, requirements, progression, values] = await this.dataLoader.loadAll([
        `${this.route.dataFolder}/page.json`,
        `${this.route.dataFolder}/divisions.json`,
        `${this.route.dataFolder}/requirements.json`,
        `${this.route.dataFolder}/progression.json`,
        `${this.route.dataFolder}/values.json`,
      ]);
    } catch (_error) {
      this.root.innerHTML = `
        <article class="panel error-state">
          <p class="section-label">Unavailable</p>
          <h1 class="section-title">Department data missing</h1>
          <p class="section-copy">This route exists, but its department profile has not been configured yet.</p>
        </article>
      `;
      return;
    }

    if (pageConfig.hero.backgroundImage) {
      this.root.style.setProperty("--department-hero-image", toCssImageUrl(pageConfig.hero.backgroundImage));
    } else {
      this.root.style.removeProperty("--department-hero-image");
    }

    this.root.classList.add("department-page", `department-page--${this.departmentKey}`);

    const previewRanks = pageConfig.progressionPreview ?? this._getProgressionPreview(progression);
    this._progressionFocusId = pageConfig.progressionFocusId ?? null;
    const showReqMore = requirements.length > 5;

    this.root.innerHTML = `
      <section class="department-page__hero reveal" data-reveal data-hero-trail>
        <div class="department-page__hero-inner department-page__hero-inner--solo">
          <div class="department-page__copy">
            <p class="section-label">${pageConfig.hero.eyebrow}</p>
            <h1 class="department-page__title">${pageConfig.hero.title}</h1>
            <p class="department-page__description">${pageConfig.hero.description}</p>
            <div class="department-page__actions">
              <a class="button button--primary" ${buildLinkAttributes(pageConfig.hero.actions.primary)}>${pageConfig.hero.actions.primary.label}</a>
              <a class="button button--ghost" ${buildLinkAttributes(pageConfig.hero.actions.secondary)}>${pageConfig.hero.actions.secondary.label}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="department-page__details reveal" data-reveal>
        <article class="panel detail-panel">
          <h2 class="detail-panel__title">${pageConfig.sections.divisions}</h2>
          <ul class="detail-list detail-list--names">
            ${divisions.map((d) => `<li><strong>${d.name}</strong></li>`).join("")}
          </ul>
          <hr class="detail-panel__rule">
          <button class="dept-text-link" data-action="open-divisions-modal">View all divisions</button>
        </article>

        <article class="panel detail-panel">
          <h2 class="detail-panel__title">${pageConfig.sections.requirements}</h2>
          <ul class="detail-list">
            ${requirements
              .slice(0, 5)
              .map((r) => `<li>${r}</li>`)
              .join("")}
          </ul>
          ${showReqMore ? `<hr class="detail-panel__rule"><button class="dept-text-link" data-action="open-requirements-modal">View more</button>` : ""}
        </article>

        <article class="panel detail-panel">
          <h2 class="detail-panel__title">${pageConfig.sections.progression}</h2>
          <ul class="detail-list">
            ${previewRanks.map((rank) => `<li>${rank}</li>`).join("")}
          </ul>
          <hr class="detail-panel__rule">
          <button class="dept-text-link" data-action="open-progression-modal">View all progressions</button>
        </article>
      </section>

      <section class="department-page__values reveal" data-reveal>
        ${values
          .map(
            (value) => `
              <article class="value-card">
                <span class="value-card__icon">${value.icon}</span>
                <div class="value-card__text">
                  <strong>${value.title}</strong>
                  <span>${value.description}</span>
                </div>
              </article>
            `,
          )
          .join("")}
      </section>
    `;

    this._mountModal();
    this._bindEvents(divisions, requirements, progression);
  }

  /* ── modal DOM (lives on body to escape stacking context) ─── */

  _mountModal() {
    const el = document.createElement("div");
    el.className = "dept-modal";
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-dept-modal", "");
    el.innerHTML = `
      <div class="dept-modal__backdrop" data-modal-close></div>
      <div class="dept-modal__panel" role="dialog" aria-modal="true">
        <button class="dept-modal__close" data-modal-close aria-label="Close">&#x2715;</button>
        <div class="dept-modal__body" data-modal-body></div>
      </div>
    `;
    document.body.appendChild(el);
    this._modalEl = el;
  }

  /* ── helpers ─────────────────────────────────────────────────── */

  _getProgressionPreview(progression) {
    const ranks = [];
    const seen = new Set();
    const walk = (nodes) => {
      for (const node of nodes) {
        if (!seen.has(node.rank)) {
          seen.add(node.rank);
          ranks.push(node.rank);
        }
        if (node.children?.length) walk(node.children);
      }
    };
    walk(progression);
    return ranks;
  }

  /* ── events ──────────────────────────────────────────────────── */

  _bindEvents(divisions, requirements, progression) {
    this.root.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action === "open-divisions-modal") this._openDivisionsModal(divisions);
      if (action === "open-requirements-modal") this._openRequirementsModal(requirements);
      if (action === "open-progression-modal") this._openProgressionModal(progression);
    });

    this._modalEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-modal-close]")) this._closeModal();
    });

    this._escListener = (e) => {
      if (e.key === "Escape") this._closeModal();
    };
    document.addEventListener("keydown", this._escListener);
  }

  /* ── modal core ──────────────────────────────────────────────── */

  _openModal(contentHtml) {
    const body = this._modalEl.querySelector("[data-modal-body]");
    body.innerHTML = contentHtml;
    this._modalEl.setAttribute("aria-hidden", "false");
    this._modalEl.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  _closeModal() {
    this._modalEl.setAttribute("aria-hidden", "true");
    this._modalEl.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ── divisions modal ─────────────────────────────────────────── */

  _openDivisionsModal(divisions) {
    this._openModal(`
      <h2 class="dept-modal__title">Divisions</h2>
      <div class="division-cards">
        ${divisions
          .map(
            (d) => `
          <div class="division-card">
            <strong class="division-card__name">${d.name}</strong>
            <p class="division-card__desc">${d.description}</p>
            <div class="division-card__roles">
              <div class="division-card__role">
                <span class="division-card__role-label">${d.sgtLabel || "Sergeant"}</span>
                <span class="division-card__role-value">${d.sgt || "Vacant Position"}</span>
              </div>
              <div class="division-card__role">
                <span class="division-card__role-label">${d.inspectorLabel || "Inspector"}</span>
                <span class="division-card__role-value">${d.inspector || "Vacant Position"}</span>
              </div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `);
  }

  /* ── requirements modal ──────────────────────────────────────── */

  _openRequirementsModal(requirements) {
    this._openModal(`
      <h2 class="dept-modal__title">Requirements</h2>
      <ul class="dept-modal__list">
        ${requirements.map((r) => `<li>${r}</li>`).join("")}
      </ul>
    `);
  }

  /* ── progression modal ───────────────────────────────────────── */

  _openProgressionModal(progression) {
    this._openModal(`
      <h2 class="dept-modal__title">Progression Hierarchy</h2>
      <p class="dept-modal__subtitle">Drag to pan · Scroll or pinch to zoom.</p>
      <div class="prog-canvas" data-prog-canvas>
        <div class="prog-canvas__inner" data-prog-inner style="transform: translate(0px,0px) scale(1)">
          <div class="prog-tree" data-prog-tree>
            ${progression.map((node) => this._renderTreeNode(node)).join("")}
          </div>
        </div>
        <div class="prog-canvas__controls">
          <button class="prog-zoom-btn" data-zoom-in title="Zoom in">＋</button>
          <button class="prog-zoom-btn" data-zoom-out title="Zoom out">－</button>
          <button class="prog-zoom-btn" data-zoom-fit title="Fit to view">⤢</button>
        </div>
      </div>
    `);

    this._initCanvasInteraction(this._progressionFocusId);
  }

  _renderTreeNode(node) {
    const hasChildren = node.children?.length > 0;

    return `
      <div class="prog-node" data-node-id="${node.id}">
        <div class="prog-node__card">
          <span class="prog-node__rank">${node.rank}</span>
          <span class="prog-node__name">${node.name || "Vacant Position"}</span>
        </div>
        ${hasChildren ? `<div class="prog-node__children">${node.children.map((child) => this._renderTreeNode(child)).join("")}</div>` : ""}
      </div>
    `;
  }

  /* ── canvas drag + zoom ──────────────────────────────────────── */

  _initCanvasInteraction(focusId = null) {
    const canvas = this._modalEl.querySelector("[data-prog-canvas]");
    const inner = this._modalEl.querySelector("[data-prog-inner]");

    if (!canvas || !inner) return;

    let tx = 0, ty = 0, scale = 1;
    let dragging = false;
    let startX = 0, startY = 0, startTx = 0, startTy = 0;

    const apply = () => {
      inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    const fitView = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const tw = inner.scrollWidth;
      const th = inner.scrollHeight;
      const pad = 24;
      const fitScale = Math.min((cw - pad * 2) / tw, (ch - pad * 2) / th, 1);
      scale = Math.max(fitScale, 0.35);
      tx = (cw - tw * scale) / 2;
      ty = Math.max((ch - th * scale) / 2, pad);
      apply();
    };

    /* initial view: focus a specific node if set, otherwise fit whole tree */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (focusId) {
          const focusNode = inner.querySelector(`[data-node-id="${focusId}"]`);
          if (focusNode) {
            const cw = canvas.clientWidth;
            const ch = canvas.clientHeight;
            scale = 1;
            /* accumulate offset relative to inner (transform not yet applied) */
            let nx = 0, ny = 0;
            let el = focusNode;
            while (el && el !== inner) {
              nx += el.offsetLeft;
              ny += el.offsetTop;
              el = el.offsetParent;
            }
            const nw = focusNode.offsetWidth;
            const nh = focusNode.offsetHeight;
            tx = cw / 2 - (nx + nw / 2) * scale;
            ty = ch / 2 - (ny + nh / 2) * scale;
            apply();
            return;
          }
        }
        fitView();
      });
    });

    /* drag start */
    const onDown = (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      startTx = tx;
      startTy = ty;
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      tx = startTx + (pt.clientX - startX);
      ty = startTy + (pt.clientY - startY);
      apply();
      e.preventDefault();
    };

    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);

    /* zoom + fit buttons */
    this._modalEl.querySelector("[data-zoom-in]").addEventListener("click", () => {
      scale = clamp(scale + 0.15, 0.35, 2);
      apply();
    });
    this._modalEl.querySelector("[data-zoom-out]").addEventListener("click", () => {
      scale = clamp(scale - 0.15, 0.35, 2);
      apply();
    });
    this._modalEl.querySelector("[data-zoom-fit]").addEventListener("click", fitView);

    /* scroll to zoom — zoom toward cursor position */
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevScale = scale;
      scale = clamp(scale - e.deltaY * 0.001, 0.35, 2);
      const ratio = scale / prevScale;
      tx = mx - ratio * (mx - tx);
      ty = my - ratio * (my - ty);
      apply();
    }, { passive: false });
  }

  /* ── teardown ────────────────────────────────────────────────── */

  destroy() {
    if (this._escListener) document.removeEventListener("keydown", this._escListener);
    document.body.style.overflow = "";
    this._modalEl?.remove();
    this._modalEl = null;
  }
}
