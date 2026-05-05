import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Razorpay from "razorpay";
import admin from "firebase-admin";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin (Only if not already initialized and credentials exist)
  // Usually in production you pass GOOGLE_APPLICATION_CREDENTIALS,
  // For Razorpay, we normally need an admin to fetch keys.

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example Razorpay endpoint
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, receipt } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
         // fallback: fetch from firebase admin if configured there
         return res.status(500).json({ error: "Razorpay keys not configured" });
      }

      const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: amount, // amount in the smallest currency unit (e.g., paise)
        currency: "INR",
        receipt: receipt
      };

      const order = await instance.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
