export function fixAppHeight() {
    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };
    setHeight();
    window.addEventListener("resize", setHeight);
  }
  