# 📍 Pointless App

**Pointless App** is a gamified urban exploration tool built with React. It’s designed for those who want to break their daily routine and explore the city in a completely unpredictable way.

The concept is simple: The app takes your current location, generates a random destination within your chosen radius (e.g., 500m, 5km, 10km), and challenges you to get there. No pre-planned routes, no specific cafes or shops — just a random dot on the map and your curiosity.

---

## 🚀 Features

- **Dynamic Radius:** Choose how far you want to go (Short Walk, City Hike, or Marathon).
- **True Randomness:** A custom mathematical algorithm ensures points are distributed evenly across the area, accounting for Earth's curvature.
- **Real-time Tracking:** See your current position relative to the target point.
- **Minimalist UI:** No distractions, just you and the destination.
- **Mobile Ready:** Built with a "Mobile-First" mindset for easy transition to React Native.

## 🛠 Tech Stack

- **Framework:** [React.js](https://reactjs.org/) (Vite)
- **Maps:** [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/)
- **Geolocation:** Browser Geolocation API
- **Styling:** CSS

## 🎲 The Algorithm

The app uses a custom displacement formula to generate coordinates. Unlike simple random offsets which tend to cluster points near the center, our implementation uses the square root of the random variable to ensure a **uniform distribution** across the circular area:

$$w = R \cdot \sqrt{random()}$$
$$t = 2 \cdot \pi \cdot random()$$

This ensures that every square meter within your chosen radius has an equal chance of being your next destination.

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Eragon1x2/pointless-app.git](https://github.com/Eragon1x2/pointless-app.git)
   cd pointless-app
