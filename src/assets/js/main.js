const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function splitText() {
  document.querySelectorAll(".js-split").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    const line = document.createElement("span");
    line.className = "split-line";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "split-char";
      span.style.transitionDelay = `${i * 18}ms`;
      span.textContent = ch;
      line.appendChild(span);
    });
    el.appendChild(line);
  });
}

function setupReveals() {
  const els = document.querySelectorAll(".revelar");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revelar--in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  els.forEach((el) => io.observe(el));
}

function runSplitIn() {
  document.querySelectorAll(".split-char").forEach((span) => {
    requestAnimationFrame(() => {
      span.classList.add("in");
    });
  });
}

function setupWorldAutoTheme() {
  const section = document.getElementById("monstros");
  if (!section) return;
  const body = document.body;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          body.setAttribute("data-world", "espiritos");
        } else {
          body.setAttribute("data-world", "humano");
        }
      });
    },
    { threshold: [0, 0.35, 0.6, 1], rootMargin: "0px 0px -20% 0px" }
  );
  io.observe(section);
}

window.addEventListener("DOMContentLoaded", () => {
  splitText();
  setupReveals();
  setupWorldAutoTheme();
  if (!prefersReduced) runSplitIn();
});
