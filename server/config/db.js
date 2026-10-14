import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: true,
  });

  console.log("Connected to MongoDB Atlas");
};

export default connectDB;
