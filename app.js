const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//View Engine
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Mongoose Model
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/todolistDB");
}

//Deafult |'Today' Item Schema
const itemSchema = new mongoose.Schema({
  name: String,
});

//Add Initial Items
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "<-- Hit this to delete an item" });
const arr = [item1, item2, item3];

//customListName Schema
const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

//Insert Initial Items & Render
app.get("/", function (req, res) {
  Item.find({}, function (error, docs) {
    if (docs.length === 0) {
      Item.insertMany(arr, function (error, docs) {
        if (error) {
          console.log(error);
        } else {
          console.log(docs);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: docs });
    }
  });
});

//Post New Added Items to Default & List -ejs
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newAddedItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newAddedItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, docs) {
      docs.items.push(newAddedItem);
      docs.save();
      res.redirect("/" + listName);
    });
  }
});

//Post Detele Page
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listNameValue = req.body.listName;
  if (listNameValue === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err, docs) {
      if (!err) {
        console.log("Default/Today item deleted" + docs);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listNameValue },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, docs) {
        if (!err) {
          console.log("customeListItem deleted" + docs);
          res.redirect("/" + listNameValue);
        }
      }
    );
  }
});

//Express Route Params
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, docs) {
    if (!err) {
      if (!docs) {
        //create the requested list as new list
        const list = new List({
          name: customListName,
          items: arr,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show the existed requested list
        res.render("list", {
          listTitle: docs.name,
          newListItems: docs.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
