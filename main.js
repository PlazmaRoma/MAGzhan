"use strict";

// Пока не все материалы предоставлены. Настоящие файлы с data-ready=true доступны.
// При добавлении файла замените data-ready на true. Затем можно отключить STUB_MODE.
const STUB_MODE = true;

// The URL selects the edition; switching languages preserves the current section.
const IS_RUSSIAN = document.documentElement.lang === "ru";
function text(kk, ru) { return IS_RUSSIAN ? ru : kk; }
document.querySelectorAll(".lang a").forEach(link => {
  link.addEventListener("click", () => {
    const target = new URL(link.href);
    target.hash = location.hash;
    link.href = target.href;
  });
});

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
      showToast(text("Бұл материал дайындалуда. Кейінірек жүктеп алуға болады.", "Этот материал готовится. Его можно будет скачать позже."));
    }
  });
});

// The restored portrait is bundled with the site and works without a network request.

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
  progress.textContent = IS_RUSSIAN ? `Отвечено на ${answered} из ${questions.length} вопросов` : `${answered} / ${questions.length} сұраққа жауап берілді`;
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
    feedback.textContent = correct ? text("Дұрыс жауап.", "Верный ответ.") : text(`Дұрыс жауап: ${correctText}.`, `Верный ответ: ${correctText}.`);
    feedback.classList.add(correct ? "correct" : "wrong");
    feedback.hidden = false;
    checked.setAttribute("aria-describedby", feedback.id);
  });
  document.getElementById("resultScore").textContent = `${score} / ${questions.length}`;
  document.getElementById("resultMessage").textContent = score === 10
    ? text("Өте жақсы! Барлық сұраққа дұрыс жауап бердіңіз.", "Отлично! Вы правильно ответили на все вопросы.")
    : score >= 7
      ? text("Жақсы нәтиже! Қате жауаптарды қарап, біліміңізді толықтырыңыз.", "Хороший результат! Разберите ошибки и дополните свои знания.")
      : text("Зерттеу бөлімін қайта оқып, өзіңізді тағы бір рет тексеріңіз.", "Перечитайте раздел исследования и проверьте себя ещё раз.");
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: "center", behavior: "auto" });
});
quizForm.addEventListener("reset", () => {
  clearGrading();
  // Native reset clears inputs after the event. Reset the counter explicitly;
  // a microtask can run before the browser's default action.
  progress.textContent = IS_RUSSIAN ? `Отвечено на 0 из ${questions.length} вопросов` : `0 / ${questions.length} сұраққа жауап берілді`;
  setTimeout(() => {
    questions[0].querySelector("input").focus({ preventScroll: true });
    questions[0].scrollIntoView({ block: "center", behavior: "auto" });
  }, 0);
});
