import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route พื้นฐานตรวจสอบสถานะ API
app.get("/", (req, res) => {
  res.json({ message: "Product API is running smoothly!" });
});

// 1. GET ALL PRODUCTS - ดึงข้อมูลสินค้าทั้งหมด
app.get("/api/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET SINGLE PRODUCT BY ID - ดึงข้อมูลสินค้าตาม ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Product not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST - เพิ่มสินค้าใหม่
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([{ name, price, description }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT - อัปเดตข้อมูลสินค้าทั้งหมดหรือบางส่วนตาม ID
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    // ตรวจสอบว่ามีข้อมูลส่งมาอัปเดตไหม
    if (!name && !price && description === undefined) {
      return res.status(400).json({ error: "Please provide fields to update" });
    }

    // สร้าง Object ข้อมูลที่จะอัปเดต (เลือกเฉพาะที่มีการส่งมา)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    // ถ้าไม่พบข้อมูลสินค้าที่จะอัปเดต
    if (data.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated successfully", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE - ลบสินค้าตาม ID
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    // ถ้าไม่พบข้อมูลสินค้าที่จะลบ
    if (data.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
      deleted_item: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ส่งออก app เพื่อให้ Vercel Serverless Functions นำไปรันได้
export default app;

// เปิดพอร์ตสำหรับรัน Local (Vercel จะใช้ Serverless Handler แทน)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
