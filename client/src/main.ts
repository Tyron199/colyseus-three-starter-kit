import { joinGame } from "./network";
import { startGame } from "./game";
import "./style.css";

const joinEl = document.getElementById("join")!;
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const playButton = document.getElementById("play") as HTMLButtonElement;
const errorEl = document.getElementById("join-error")!;

nameInput.value = localStorage.getItem("playerName") ?? "";

let joining = false;

async function play() {
  if (joining) return;
  joining = true;
  playButton.disabled = true;
  errorEl.classList.add("hidden");

  const name = nameInput.value.trim();
  localStorage.setItem("playerName", name);

  try {
    const room = await joinGame(name);
    joinEl.classList.add("hidden");
    startGame(room).catch(console.error);
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Can't reach the server — is it running?";
    errorEl.classList.remove("hidden");
    joining = false;
    playButton.disabled = false;
  }
}

playButton.addEventListener("click", play);
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") play();
});
