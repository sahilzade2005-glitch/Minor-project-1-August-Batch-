
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, "data.json");

app.use(cors({
  origin: "http://127.0.0.1:5173"
}));
app.use(express.json({ limit: "30kb" }));

const stages = [
  "Placed",
  "Preparing",
  "Picked Up",
  "On the Way",
  "Delivered"
];

function initialData() {
  return {
    foods: [
      {
        id: "food-1",
        name: "Margherita Pizza",
        restaurant: "Pizza Paradise",
        category: "Pizza",
        price: 249,
        emoji: "🍕"
      },
      {
        id: "food-2",
        name: "Cheese Burger",
        restaurant: "Burger House",
        category: "Burger",
        price: 149,
        emoji: "🍔"
      },
      {
        id: "food-3",
        name: "Paneer Butter Masala",
        restaurant: "Spice Kitchen",
        category: "Indian",
        price: 229,
        emoji: "🍛"
      },
      {
        id: "food-4",
        name: "Hakka Noodles",
        restaurant: "Wok Express",
        category: "Chinese",
        price: 179,
        emoji: "🍜"
      },
      {
        id: "food-5",
        name: "Veg Supreme Pizza",
        restaurant: "Pizza Paradise",
        category: "Pizza",
        price: 329,
        emoji: "🍕"
      },
      {
        id: "food-6",
        name: "Veggie Burger",
        restaurant: "Burger House",
        category: "Burger",
        price: 129,
        emoji: "🍔"
      },
      {
        id: "food-7",
        name: "Veg Biryani",
        restaurant: "Spice Kitchen",
        category: "Indian",
        price: 199,
        emoji: "🍚"
      },
      {
        id: "food-8",
        name: "Chocolate Cake",
        restaurant: "Sweet Treats",
        category: "Dessert",
        price: 159,
        emoji: "🍰"
      },
      {
        id: "food-9",
        name: "Veg Fried Rice",
        restaurant: "Wok Express",
        category: "Chinese",
        price: 169,
        emoji: "🍚"
      },
      {
        id: "food-10",
        name: "Ice Cream Sundae",
        restaurant: "Sweet Treats",
        category: "Dessert",
        price: 119,
        emoji: "🍨"
      }
    ],
    orders: []
  };
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(initialData(), null, 2)
  );
}

function readDB() {
  return JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
  );
}

function saveDB(data) {
  const temp = DB_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, DB_FILE);
}

function validText(value, maxLength = 100) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// Each stage lasts 30 seconds in demo mode.
const STAGE_DURATION = 30000;

function updateDemoOrders(db) {
  let changed = false;
  const now = Date.now();

  for (const order of db.orders) {
    if (order.status === "Delivered") continue;

    const started = new Date(order.createdAt).getTime();

    if (!Number.isFinite(started)) continue;

    const stageIndex = Math.min(
      Math.floor((now - started) / STAGE_DURATION),
      stages.length - 1
    );

    const nextStatus = stages[Math.max(0, stageIndex)];

    // Never move an order backwards.
    const currentIndex = stages.indexOf(order.status);

    if (stageIndex > currentIndex) {
      order.status = nextStatus;
      changed = true;
    }
  }

  if (changed) saveDB(db);

  return db;
}

app.get("/", (req, res) => {
  res.json({
    message: "FoodTrack Backend is running"
  });
});

// Get menu items
app.get("/api/foods", (req, res) => {
  const db = readDB();
  res.json(db.foods);
});

// Get dashboard
app.get("/api/dashboard", (req, res) => {
  const db = updateDemoOrders(readDB());

  res.json({
    totalFoods: db.foods.length,
    totalOrders: db.orders.length,
    activeOrders: db.orders.filter(
      order => order.status !== "Delivered"
    ).length,
    deliveredOrders: db.orders.filter(
      order => order.status === "Delivered"
    ).length
  });
});

// Get orders
app.get("/api/orders", (req, res) => {
  const db = updateDemoOrders(readDB());

  // Hide phone numbers and addresses in demo listings.
  const publicOrders = db.orders.map(
    ({ phone, address, ...order }) => order
  );

  res.json(publicOrders.reverse());
});

// Place an order
app.post("/api/orders", (req, res) => {
  const { name, phone, address, items } = req.body;

  if (
    !validText(name, 100) ||
    typeof phone !== "string" ||
    !/^[0-9]{10}$/.test(phone) ||
    !validText(address, 300) ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 30
  ) {
    return res.status(400).json({
      message: "Please enter valid order details."
    });
  }

  const db = readDB();
  const orderItems = [];

  for (const item of items) {
    if (
      !item ||
      typeof item.foodId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      return res.status(400).json({
        message: "Invalid cart item."
      });
    }

    const food = db.foods.find(f => f.id === item.foodId);

    if (!food) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }

    orderItems.push({
      foodId: food.id,
      name: food.name,
      price: food.price,
      quantity: item.quantity
    });
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = {
    id: crypto.randomUUID(),
    name: name.trim(),
    phone,
    address: address.trim(),
    items: orderItems,
    subtotal,
    deliveryFee: 40,
    total: subtotal + 40,
    status: "Placed",
    createdAt: new Date().toISOString()
  };

  db.orders.push(order);
  saveDB(db);

  res.status(201).json({
    message: "Order placed successfully",
    order: {
      id: order.id,
      total: order.total,
      status: order.status
    }
  });
});

// Manually update order status (demo admin endpoint)
app.patch("/api/orders/:id/status", (req, res) => {
  const { status } = req.body;

  if (!stages.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status."
    });
  }

  const db = updateDemoOrders(readDB());
  const order = db.orders.find(
    item => item.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found."
    });
  }

  order.status = status;
  saveDB(db);

  res.json({
    message: "Order status updated",
    status: order.status
  });
});

// Invalid JSON handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON."
    });
  }

  console.error(err);

  res.status(500).json({
    message: "Internal server error."
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `FoodTrack Backend running at http://127.0.0.1:${PORT}`
  );
});
