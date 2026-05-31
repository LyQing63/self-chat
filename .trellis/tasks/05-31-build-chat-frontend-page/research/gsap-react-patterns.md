# Research: GSAP Integration with React 19

- **Query**: GSAP integration with React 19 in 2025-2026 -- installation, useGSAP hook, gsap.context(), stagger/slide-in/collapse/scroll animations, performance best practices
- **Scope**: external (official GSAP skills documentation)
- **Date**: 2026-05-31

## Project Context

- **React**: 19.2.6
- **Vite**: 8.0.12
- **TypeScript**: 6.0.2
- **Current state**: No GSAP packages installed. Fresh Vite + React scaffold.

---

## 1. Installation

Two packages are required:

```bash
npm install gsap
npm install @gsap/react
```

- `gsap` -- the core animation engine (includes CSSPlugin, easing, transforms, etc.)
- `@gsap/react` -- provides the `useGSAP()` hook with automatic cleanup and context scoping

No additional type packages are needed; GSAP ships its own types.

### Registration

Before any GSAP code runs, register the hook (and any plugins):

```typescript
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);
// If using ScrollTrigger:
// import ScrollTrigger from "gsap/ScrollTrigger";
// gsap.registerPlugin(ScrollTrigger);
```

---

## 2. The useGSAP Hook

### Basic Usage

```typescript
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

function AnimatedComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(".box", { x: 100 });
    gsap.from(".item", { opacity: 0, stagger: 0.1 });
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="box">Box</div>
      <div className="item">Item 1</div>
      <div className="item">Item 2</div>
    </div>
  );
}
```

### Key Behaviors

- **Automatic cleanup**: On unmount, all animations and ScrollTriggers created inside the callback are reverted (inline styles removed, killed).
- **Scope**: Passing `{ scope: containerRef }` scopes all selector strings (like `.box`) to that container, preventing cross-component selector collisions.
- **Dependencies**: By default, the callback runs once (empty deps). Pass `{ dependencies: [someValue] }` to re-run when values change.
- **revertOnUpdate**: `{ revertOnUpdate: true }` causes the context to be fully reverted and re-created when dependencies change. Useful for responsive or conditional animations.

### Full Config Object

```typescript
useGSAP(() => {
  // animation code
}, {
  dependencies: [endX],      // re-run when endX changes
  scope: containerRef,       // scope selectors to this ref
  revertOnUpdate: true       // revert + re-create on dependency change
});
```

### contextSafe for Event Handlers

Animations created inside event handlers (click, hover, etc.) execute AFTER `useGSAP` runs, so they are NOT part of the context and won't be cleaned up. Use `contextSafe` to wrap them:

```typescript
useGSAP((context, contextSafe) => {
  // Safe: created during execution
  gsap.to(goodRef.current, { x: 100 });

  // DANGER: event handler runs later, not in context
  // badRef.current.addEventListener('click', () => {
  //   gsap.to(badRef.current, { y: 100 }); // LEAK!
  // });

  // SAFE: wrapped in contextSafe
  const onClickGood = contextSafe(() => {
    gsap.to(goodRef.current, { rotation: 180 });
  });
  goodRef.current.addEventListener('click', onClickGood);

  return () => {
    goodRef.current.removeEventListener('click', onClickGood);
  };
}, { scope: containerRef });
```

---

## 3. gsap.context() (Fallback Pattern)

When `@gsap/react` is not available or when `useEffect` trigger behavior is needed:

```typescript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
    gsap.from(".item", { opacity: 0, stagger: 0.1 });
  }, containerRef); // scope as second arg

  return () => ctx.revert(); // ALWAYS clean up
}, []);
```

**Critical**: Always call `ctx.revert()` in the cleanup function. Without it, animations leak and keep running on detached DOM nodes.

---

## 4. Common Animation Patterns

### 4a. Stagger Animations (Message Lists)

Stagger offsets each element's animation by a time interval.

```typescript
// Simple stagger -- each item delayed by 0.1s
gsap.to(".message", {
  y: 0,
  opacity: 1,
  stagger: 0.1
});

// Object syntax for advanced control
gsap.to(".message", {
  y: 0,
  opacity: 1,
  stagger: {
    each: 0.08,
    from: "start"   // "start" | "center" | "end" | "edges" | "random" | index
  }
});

// Function-based values for per-element customization
gsap.to(".message", {
  x: (i, target, targetsArray) => i * 10,
  opacity: 1,
  stagger: 0.05
});
```

**For a chat message list**, use `gsap.from()` to animate new messages in:

```typescript
useGSAP(() => {
  gsap.from(".message", {
    y: 20,
    opacity: 0,
    duration: 0.4,
    ease: "power2.out",
    stagger: 0.06
  });
}, { scope: containerRef });
```

**For dynamically added messages**, use `contextSafe` to animate individual new items in an event handler, or use `revertOnUpdate` to re-run when the message array changes.

### 4b. Slide-in / Fade-in Animations

```typescript
// Slide up and fade in
gsap.from(".element", {
  y: 40,            // start 40px below
  opacity: 0,
  duration: 0.5,
  ease: "power3.out"
});

// Slide in from left
gsap.from(".element", {
  x: -60,
  opacity: 0,
  duration: 0.5,
  ease: "power2.out"
});

// Using autoAlpha (better than opacity -- sets visibility:hidden at 0)
gsap.from(".element", {
  y: 30,
  autoAlpha: 0,     // opacity:0 + visibility:hidden
  duration: 0.4,
  ease: "power2.out"
});
```

**Prefer `autoAlpha` over raw `opacity`**: When value is 0, GSAP also sets `visibility: hidden` (no pointer events, better rendering). When non-zero, `visibility` is set to `inherit`.

### 4c. Collapse/Expand Animations (Height Auto)

Animating `height` directly is a layout property and triggers reflow. GSAP can animate to `height: "auto"` which CSS transitions cannot do natively:

```typescript
// Expand
gsap.to(".panel", {
  height: "auto",
  duration: 0.4,
  ease: "power2.inOut"
});

// Collapse
gsap.to(".panel", {
  height: 0,
  duration: 0.3,
  ease: "power2.inOut"
});
```

**Performance note**: `height` animation triggers layout. For better performance, consider these alternatives:

1. **ScaleY with transformOrigin**: Visually collapses without layout thrashing:
   ```typescript
   gsap.to(".panel", {
     scaleY: 0,
     transformOrigin: "top center",
     duration: 0.3,
     ease: "power2.inOut"
   });
   ```
   Downside: content is visually squished, not hidden.

2. **Clip-path**: Modern approach, compositor-friendly:
   ```typescript
   gsap.to(".panel", {
     clipPath: "inset(0 0 100% 0)",  // fully clipped
     duration: 0.3,
     ease: "power2.inOut"
   });
   ```

3. **Max-height trick**: Animate `maxHeight` from 0 to a known large value. Not as clean but avoids `height: auto` limitations.

For a chat panel collapse/expand where content must be properly laid out, `height: "auto"` via GSAP is the pragmatic choice despite the layout cost.

### 4d. ScrollTrigger (If Needed)

```typescript
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Basic scroll-triggered animation
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",      // when top of trigger hits center of viewport
    end: "bottom center",
    toggleActions: "play reverse play reverse"
  }
});

// Scrub -- animation progress tied to scroll position
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",
    end: "bottom center",
    scrub: true               // or number for smooth lag (e.g. scrub: 1)
  }
});

// Pin a section
scrollTrigger: {
  trigger: ".section",
  start: "top top",
  end: "+=1000",              // pin for 1000px of scroll
  pin: true,
  scrub: 1
}
```

**In React with useGSAP**: ScrollTrigger cleanup is automatic when created inside `useGSAP`.

**ScrollTrigger.batch()** -- animate groups of elements as they enter viewport:

```typescript
ScrollTrigger.batch(".message", {
  onEnter: (elements) => {
    gsap.to(elements, { opacity: 1, y: 0, stagger: 0.15 });
  },
  start: "top 80%"
});
```

---

## 5. Best Practices for Animating React Components

### Refs and Targets

- Always use **refs** for animation targets, or use a container ref with **scope** so selectors are scoped.
- For multiple elements: use a ref to the container and query children, or use an array of refs.
- Never rely on global selectors (`.box`) without a scope -- they can match elements outside the component across re-renders.

### Layout Animations

- Use `gsap.from()` for entrance animations (element starts at animated values, ends at CSS-defined state).
- Use `gsap.to()` for exit animations.
- Use `gsap.fromTo()` when both start and end states need to be explicit.
- Use `immediateRender: false` when stacking multiple `from()` or `fromTo()` tweens on the same target to avoid the later tween overwriting the first tween's start state before it runs.

### Server-Side Rendering

- GSAP runs in the browser only. Never call `gsap.*` or `ScrollTrigger.*` during SSR.
- `useGSAP` (and `useEffect`) ensures code runs only on the client.
- For dynamic imports: `const gsap = await import("gsap")` inside useEffect if bundle size is a concern.

### Accessibility (prefers-reduced-motion)

Use `gsap.matchMedia()` to respect user preferences:

```typescript
const mm = gsap.matchMedia();

mm.add(
  {
    reduceMotion: "(prefers-reduced-motion: reduce)"
  },
  (context) => {
    const { reduceMotion } = context.conditions;
    gsap.to(".box", {
      x: 100,
      duration: reduceMotion ? 0 : 0.5
    });
  }
);
```

---

## 6. Performance Considerations

### Transforms vs Layout Properties

| Animate (prefer)         | Avoid when possible           |
|--------------------------|-------------------------------|
| `x`, `y` (translate)     | `left`, `top`, `margin`       |
| `scale`, `scaleX/Y`      | `width`, `height`             |
| `rotation`               |                               |
| `opacity` / `autoAlpha`  |                               |
| `skewX`, `skewY`         |                               |

Transform and opacity stay on the compositor thread -- no layout or paint. Layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`) trigger full reflow.

### will-change

Apply in CSS on elements that will animate:

```css
.animated-element {
  will-change: transform;
}
```

Do NOT set `will-change` on every element "just in case" -- it consumes GPU memory.

### Stagger Efficiency

- Use `stagger` on a single tween instead of creating many separate tweens with manual delays.
- For very long lists (hundreds of items), consider virtualizing or only animating visible items.

### quickTo for Frequent Updates

For properties updated on every frame (mouse followers, drag):

```typescript
const xTo = gsap.quickTo("#cursor", "x", { duration: 0.4, ease: "power3" });
const yTo = gsap.quickTo("#cursor", "y", { duration: 0.4, ease: "power3" });

element.addEventListener("mousemove", (e) => {
  xTo(e.pageX);
  yTo(e.pageY);
});
```

`quickTo` reuses a single tween instead of creating new ones each time.

### Cleanup

- `useGSAP` handles cleanup automatically.
- With `useEffect` + `gsap.context()`, always call `ctx.revert()`.
- Kill off-screen or inactive animations when not visible.
- Call `ScrollTrigger.refresh()` only when layout actually changes (debounce).

---

## 7. Summary of Packages and Imports

```typescript
// Installation
// npm install gsap @gsap/react

// Core imports
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Plugin imports (as needed)
import ScrollTrigger from "gsap/ScrollTrigger";

// Registration (run once, before any usage)
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger); // if using ScrollTrigger
```

---

## Caveats / Not Found

- **React 19 compatibility**: The official GSAP React documentation references React 18 patterns. React 19 does not change the hook model (`useRef`, `useEffect` are unchanged), so `useGSAP` from `@gsap/react` should work without issues. The `@gsap/react` package uses `useIsomorphicLayoutEffect` internally, which is compatible with React 19.
- **React Compiler (babel-plugin-react-compiler)**: The project uses React Compiler. GSAP's `useGSAP` hook internally uses refs and layout effects, which should be compatible, but this should be tested. If issues arise, wrapping GSAP components with `"use no memo"` directive may be needed.
- **No version pinning found**: The research did not pin specific GSAP version numbers. The latest GSAP v3.x is recommended. Check `npm info gsap version` at install time.

## External References

- [GSAP React Guide](https://gsap.com/resources/React) -- official React integration docs
- [GSAP Staggers](https://gsap.com/resources/getting-started/Staggers) -- stagger deep dive
- [ScrollTrigger Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) -- full ScrollTrigger reference
- [gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/) -- responsive + reduced motion
