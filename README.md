# Slemmings

An HTML5/Canvas-based puzzle game inspired by the classic **Lemmings**.

![slemmings1-PXL_20260102_123829224](https://github.com/user-attachments/assets/205dcd02-6c4c-4665-8eca-ccff4e93531d)
![slemmings2-PXL_20260102_123818265](https://github.com/user-attachments/assets/9cec7cd0-1569-4b87-92df-954bbc1c3d05)

## 🎮 How to Play

**Objective:** Guide a group of mindless "Slemmings" from their spawn point to the exit portal. You must save a specific number of them within the time limit to pass the level.

### Controls

*   **Select Skill:** Click on the skill icons at the bottom of the screen.
*   **Apply Skill:** Click on a Slemming to assign the selected skill.
*   **Release Rate:** Use the `▲` / `▼` buttons to speed up or slow down the spawn rate.
*   **Pause/Resume:** Toggle the game state.
*   **Nuke:** Give up and explode all Slemmings on screen (restarts level).

## 🛠 Skills

You have a limited number of skills to assign. Choose wisely!

| Icon | Skill | Description |
| :--- | :--- | :--- |
| 🧗 | **CLIMBER** | Allows a Slemming to climb vertical walls. |
| 🎈 | **FLOATER** | Deploys a parachute to fall safely from heights. |
| 💣 | **BOMBER** | Explodes after 5 seconds, destroying nearby terrain. |
| 🛑 | **BLOCKER** | Stands still and forces other Slemmings to turn around. |
| 🪜 | **BUILDER** | Builds a bridge of steps upwards. |
| 🤜 | **BASHER** | Digs horizontally through walls. |
| ⛏️ | **MINER** | Digs a diagonal tunnel downwards. |
| 👇 | **DIGGER** | Digs a vertical shaft straight down. |

## 🚀 Run Locally

**Prerequisites:** Node.js (v20+)

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```

## ☁️ Deployment

This project handles deployment via **GitHub Actions**. Pushing to the `main` branch automatically builds and deploys the game to GitHub Pages.
