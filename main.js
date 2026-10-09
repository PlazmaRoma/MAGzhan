"use strict";

// Пока не все материалы предоставлены. Настоящие файлы с data-ready=true доступны.
// При добавлении файла замените data-ready на true. Затем можно отключить STUB_MODE.
const STUB_MODE = true;

// Казахские подписи и сообщения вычитаны 07.10.2026. TODO: финально согласовать регистр обращения с преподавателем.
// Сейчас доступен только kk; русская версия будет добавлена после перевода материала.
const AVAILABLE_LANGUAGES = ["kk"];
function rememberLanguage() {
  let saved = "kk";
  try { saved = localStorage.getItem("magzhan.language") || "kk"; } catch (_) {}
  const language = AVAILABLE_LANGUAGES.includes(saved) ? saved : "kk";
  document.documentElement.lang = language;
  try { localStorage.setItem("magzhan.language", language); } catch (_) {}
}
rememberLanguage();
document.querySelector('[data-lang="kk"]').addEventListener("click", rememberLanguage);

// Оглавление открывает выбранную главу. Само раскрытие details работает и без JS.
function openChapter(hash) {
  const target = document.getElementById(hash.slice(1));
  const chapter = target?.closest("details");
  if (chapter) chapter.open = true;
}
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", () => openChapter(link.hash));
});
window.addEventListener("hashchange", () => openChapter(location.hash));
openChapter(location.hash);

const toast = document.getElementById("toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4500);
}
document.querySelectorAll(".files .dl").forEach(link => {
  link.addEventListener("click", event => {
    if (link.dataset.ready === "true") return;
    if (STUB_MODE) {
      event.preventDefault();
      showToast("Бұл материал дайындалуда. Кейінірек жүктеп алуға болады.");
    }
  });
});

// Фото загружается через Wikimedia REST API, а не через HTML статьи.
// Любой сетевой сбой оставляет книжную заглушку; он не мешает работе страницы.
async function loadPortrait() {
  const status = document.getElementById("photoStatus");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    // В русской статье главное изображение — марка. Казахская статья содержит портрет.
    const title = encodeURIComponent("Мағжан_Бекенұлы_Жұмабаев");
    const response = await fetch(`https://kk.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Portrait unavailable");
    const data = await response.json();
    const source = data.originalimage?.source || data.thumbnail?.source;
    if (!source) throw new Error("No portrait");
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== "upload.wikimedia.org") {
      throw new Error("Unexpected image URL");
    }
    const image = new Image();
    image.alt = "Мағжан Жұмабаевтың портреті";
    image.decoding = "async";
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = url.href;
    await Promise.race([
      loaded,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Image timeout")), 8000)),
    ]);
    document.getElementById("photoFrame").replaceChildren(image);
    status.textContent = "";
  } catch (_) {
    status.textContent = "Портрет жүктелмеді. Уикипедиядағы сілтемені ашуға болады.";
  } finally {
    clearTimeout(timeout);
  }
}
loadPortrait();

// Ключи ответов перенесены из DOCX заказчика, не создаются автоматически.
const ANSWERS = [1, 1, 2, 2, 1, 0, 1, 0, 1, 0];
const quizForm = document.getElementById("quizForm");
const questions = [...quizForm.querySelectorAll(".question")];
const progress = document.getElementById("quizProgress");
const result = document.getElementById("quizResult");

function clearGrading() {
  result.hidden = true;
  questions.forEach(question => {
    question.querySelectorAll(".option").forEach(option => {
      option.classList.remove("is-correct", "is-wrong");
    });
    const feedback = question.querySelector(".answer-feedback");
    feedback.hidden = true;
    feedback.textContent = "";
    feedback.classList.remove("correct", "wrong");
    question.querySelectorAll("input").forEach(input => input.removeAttribute("aria-describedby"));
  });
}
function updateProgress() {
  const answered = questions.filter(q => q.querySelector("input:checked")).length;
  progress.textContent = `${answered} / ${questions.length} сұраққа жауап берілді`;
}
quizForm.addEventListener("change", () => {
  clearGrading();
  updateProgress();
});
quizForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!quizForm.reportValidity()) return;
  let score = 0;
  questions.forEach((question, i) => {
    const checked = question.querySelector("input:checked");
    const correctInput = question.querySelector(`input[value="${ANSWERS[i]}"]`);
    const correct = Number(checked.value) === ANSWERS[i];
    if (correct) score += 1;
    correctInput.closest(".option").classList.add("is-correct");
    if (!correct) checked.closest(".option").classList.add("is-wrong");
    const feedback = question.querySelector(".answer-feedback");
    const correctText = correctInput.closest(".option").lastElementChild.textContent;
    feedback.textContent = correct ? "Дұрыс жауап." : `Дұрыс жауап: ${correctText}.`;
    feedback.classList.add(correct ? "correct" : "wrong");
    feedback.hidden = false;
    checked.setAttribute("aria-describedby", feedback.id);
  });
  document.getElementById("resultScore").textContent = `${score} / ${questions.length}`;
  document.getElementById("resultMessage").textContent = score === 10
    ? "Өте жақсы! Барлық сұраққа дұрыс жауап бердіңіз."
    : score >= 7
      ? "Жақсы нәтиже! Қате жауаптарды қарап, біліміңізді толықтырыңыз."
      : "Зерттеу бөлімін қайта оқып, өзіңізді тағы бір рет тексеріңіз.";
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: "center", behavior: "auto" });
});
quizForm.addEventListener("reset", () => {
  clearGrading();
  // Native reset clears inputs after the event. Reset the counter explicitly;
  // a microtask can run before the browser's default action.
  progress.textContent = `0 / ${questions.length} сұраққа жауап берілді`;
  setTimeout(() => {
    questions[0].querySelector("input").focus({ preventScroll: true });
    questions[0].scrollIntoView({ block: "center", behavior: "auto" });
  }, 0);
});
