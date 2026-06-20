<script lang="ts">
  import { setContext } from "svelte";
  import { GlassScene, GlassPanel } from "@kussetsu/svelte";
  import { GLASS_THEME_KEY } from "./ui/theme";
  import ControlPanel from "./ControlPanel.svelte";
  import Button from "./ui/Button.svelte";
  import Toggle from "./ui/Toggle.svelte";
  import Badge from "./ui/Badge.svelte";
  import Segmented from "./ui/Segmented.svelte";
  import Field from "./ui/Field.svelte";
  import Slider from "./ui/Slider.svelte";

  const assetBase = import.meta.env.BASE_URL;

  // Component state
  let notifications = $state(true);
  let autoSync = $state(false);
  let theme = $state("Auto");
  let name = $state("Ada Lovelace");
  let volume = $state(64);

  // The control panel drives every component at once. Components spread these
  // and override only their identity props (badge colors, pill radii).
  const DEFAULTS = { radius: 14, blur: 0, bgBlur: 3, refraction: 0.05, dispersion: 0.006, rim: 0.05, tint: 0.04, specular: 1 };
  const DEFAULT_COLOR = "#e6ebf2";
  type Key = keyof typeof DEFAULTS;
  let p = $state({ ...DEFAULTS });
  let color = $state(DEFAULT_COLOR);

  const themeProps = () => ({
    color,
    radius: p.radius,
    blur: p.blur,
    bgBlur: p.bgBlur,
    refraction: p.refraction,
    dispersion: p.dispersion,
    rim: p.rim,
    tint: p.tint,
    specular: p.specular,
  });
  setContext(GLASS_THEME_KEY, themeProps);

  const controls: { key: Key; label: string; min: number; max: number; step: number }[] = [
    { key: "radius", label: "Radius", min: 0, max: 60, step: 1 },
    { key: "blur", label: "Frost", min: 0, max: 20, step: 0.5 },
    { key: "bgBlur", label: "BG blur", min: 0, max: 20, step: 0.5 },
    { key: "refraction", label: "Refraction", min: 0, max: 0.15, step: 0.005 },
    { key: "dispersion", label: "Dispersion", min: 0, max: 0.03, step: 0.001 },
    { key: "rim", label: "Rim width", min: 0.01, max: 0.2, step: 0.005 },
    { key: "tint", label: "Tint", min: 0, max: 0.4, step: 0.01 },
    { key: "specular", label: "Specular", min: 0, max: 2, step: 0.05 },
  ];
  const reset = () => {
    p = { ...DEFAULTS };
    color = DEFAULT_COLOR;
  };
</script>

<section class="ds-section">
  <GlassScene class="ds-stage">
    <div class="ds-bg" style="background-image: url('{assetBase}grass.jpg'); filter: blur({p.bgBlur}px);"></div>

  <!-- data-kussetsu-no-capture: labels/hero stay crisp on top, only .ds-bg refracts -->
  <div class="ds-content" data-kussetsu-no-capture>
    <GlassPanel {...themeProps()} class="ds-nav">
      <div class="nav">
        <span class="brand">◆ Kussetsu UI</span>
        <nav class="links">
          <a href="#components">Components</a>
          <a href="#docs">Docs</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <button class="solid">Get started</button>
      </div>
    </GlassPanel>

    <header class="hero">
      <h1>A design system, in glass.</h1>
      <p>
        Every control below is real, interactive DOM — refracting the wallpaper behind it.
        Not a single image of a button. Just glass. Tune it all live with the panel on the right →
      </p>
    </header>

    <div class="grid">
      <section class="group">
        <span class="glabel">Buttons</span>
        <div class="rowwrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section class="group">
        <span class="glabel">Badges</span>
        <div class="rowwrap">
          <Badge color="#7c8cff">Pro</Badge>
          <Badge color="#2fd980">New</Badge>
          <Badge color="#ffb02e">Beta</Badge>
        </div>
      </section>

      <section class="group">
        <span class="glabel">Switches</span>
        <div class="colwrap">
          <Toggle bind:checked={notifications} label="Notifications" />
          <Toggle bind:checked={autoSync} label="Auto-sync" />
        </div>
      </section>

      <section class="group">
        <span class="glabel">Segmented</span>
        <Segmented options={["Light", "Dark", "Auto"]} bind:value={theme} />
      </section>

      <section class="group">
        <span class="glabel">Input</span>
        <Field label="Display name" bind:value={name} placeholder="Your name" />
      </section>

      <section class="group">
        <span class="glabel">Slider · {volume}</span>
        <Slider bind:value={volume} />
      </section>

      <section class="group span2">
        <span class="glabel">Card</span>
        <GlassPanel {...themeProps()} class="ds-card">
          <div class="card">
            <div class="card-head">
              <h3>Upgrade to Pro</h3>
              <span class="pill">$8 / mo</span>
            </div>
            <p>Unlimited glass panels, priority support, and early access to new components.</p>
            <div class="card-actions">
              <button class="solid">Upgrade</button>
              <button class="ghost">Maybe later</button>
            </div>
          </div>
        </GlassPanel>
      </section>
    </div>
  </div>
  </GlassScene>

  <div class="rail">
    <ControlPanel bind:values={p} bind:color {controls} note="Drives every component →" onReset={reset} />
  </div>
</section>

<style>
  .ds-section {
    position: relative;
  }
  /* Right-hand rail that holds the sticky control panel for this section only. */
  .rail {
    position: absolute;
    top: 0;
    right: 16px;
    bottom: 0;
    width: 220px;
    pointer-events: none;
  }

  :global(.ds-stage) {
    position: relative;
    max-width: 1100px;
    margin: 1rem auto 4rem;
    min-height: 86vh;
    border-radius: 26px;
    overflow: hidden;
    color: #fff;
    /* Muted grass tone so the blurred wallpaper's edge fades into green, not black. */
    background: #3f4a2c;
  }
  .ds-bg {
    position: absolute;
    /* Slight bleed so blur() near the edges samples real grass, not transparency. */
    inset: -36px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .ds-content {
    position: relative;
    z-index: 1;
    padding: 1.25rem 1.5rem 2.5rem;
  }

  :global(.ds-nav) {
    display: block;
    overflow: hidden;
  }
  .nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.7rem 1rem 0.7rem 1.25rem;
  }
  .brand {
    font-weight: 700;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
  }
  .links {
    display: flex;
    gap: 1.25rem;
    margin-left: 0.5rem;
    flex: 1;
  }
  .links a {
    color: #eef0fb;
    text-decoration: none;
    font-size: 0.92rem;
    opacity: 0.92;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
  }
  .links a:hover {
    opacity: 1;
  }

  .hero {
    margin: 2.25rem 0 1.75rem;
    max-width: 44ch;
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    letter-spacing: -0.02em;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.5);
  }
  .hero p {
    margin: 0.6rem 0 0;
    color: #eef0fb;
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem 2rem;
    align-items: start;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .span2 {
    grid-column: 1 / -1;
    max-width: 460px;
  }
  .glabel {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
  }
  .rowwrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
  .colwrap {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .solid {
    all: unset;
    box-sizing: border-box;
    padding: 0.5rem 1.05rem;
    border-radius: 10px;
    background: #fff;
    color: #11142a;
    font: inherit;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .ghost {
    all: unset;
    box-sizing: border-box;
    padding: 0.5rem 1.05rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.45);
    color: #fff;
    font: inherit;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .pill {
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    font-size: 0.78rem;
    font-weight: 600;
  }

  :global(.ds-card) {
    display: block;
    overflow: hidden;
  }
  .card {
    padding: 1.4rem 1.5rem;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55);
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-head h3 {
    margin: 0;
    font-size: 1.2rem;
  }
  .card p {
    margin: 0.6rem 0 1.1rem;
    color: #eef0fb;
    font-size: 0.95rem;
  }
  .card-actions {
    display: flex;
    gap: 0.6rem;
  }
</style>
