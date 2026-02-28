# Navibrain (Navidrome Brain)

Navidrome is a great music server, but it lacks recommender systems to make
its use similar to that of proprietary music platforms. The goal of this
project is to bridge that gap to some extent.

## Technologies

This project uses Python FastAPI to build a backend that interacts with the
navidrome server. You should create a `.env` files with the credentials and
configurations necessary to interact with your navidrome instance.

The front-end is written in React. From it you can do things like seing your
"forgotten favourites" and override playlists previously created in Navidrome
with the songs you want to hear and the recommendations based on similarity to
the songs you picked.

## How does the recommendation system work?

For the first version, we rely on a simple word2vec model trained using the
`train_w2v.py` script provided in the `backend/scripts` folder. This script
receives a played music history file, and learns a word2vec representation
for any song you have heard at least 5 times (configurable with a command
line argument). When you select music to seed a list, the backend will use
the embeddings to produce a list of songs similar to your seeds.

### Training from Youtube-History

You can download a JSON file with your Youtube-Music listening history. To
do so, go to takeout.google.com.

1. Click "Deselect all" (otherwise, you'll end up with a massive file
  containing every email and photo you’ve ever saved).
2. Scroll down to the bottom and check the box for YouTube and YouTube
  Music.
3. Crucial Step: Click the button that says "Multiple formats."
4. Find the History row and change the format from "HTML" to "JSON" using
  the dropdown menu. Click OK.
5. Click the button that says "All YouTube data included."
6. Click "Deselect all" inside the popup, then check only "history". Click OK.
7. Scroll down and click Next step, then Create export.

## How to contribute

We use a test-driven approach, where tests are written first and then we
implement the functionalities. Both backend and front-end changes should
be acompanied with thorough unit tests.

### How to run the tests

**Backend Tests:**
The backend uses `pytest`. From the `backend` directory, run the following:
```bash
cd backend
PYTHONPATH=. pytest tests/
```

**Frontend Tests:**
The frontend uses `vitest`. From the `frontend` directory, run the following:
```bash
cd frontend
npm run test
```

## How to run the application

The application requires both the FastAPI backend and the React frontend to be running simultaneously.

### 1. Start the Backend Server
First, ensure you have your `.env` file configured in the `backend` directory with your Navidrome credentials:
```env
NAVIDROME_URL=http://your-navidrome-url:4533
NAVIDROME_USER=your_username
NAVIDROME_PASS=your_password
```

Then start the FastAPI development server:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
> **Note:** To run the backend on a different port, simply change the `--port 8000` argument to your desired port number (e.g., `--port 8080`).

### 2. Start the Frontend Server
The frontend needs to know where the backend API is located. Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000/api
```
*(Make sure this matches the port you configured for the backend!)*

Open a new terminal window and start the Vite development server:
```bash
cd frontend
npm run dev
```
The frontend UI will be accessible by default at `http://localhost:5173`.