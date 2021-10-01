console.log("connected");
const data = { name: "angelo" };
const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
};
fetch("/", options);
