import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { getMenus, addItemToMenu, createMenu } from "../redux/actions/menuActions"; // ✅ FIXED IMPORT
import { getRestaurants } from "../redux/actions/restaurantAction";
import Fooditem from "./Fooditem";
import axios from "axios";

const Menu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { menus, menuId, loading, error, addingItem, addError } = useSelector(
    (state) => state.menus
  );

  const { isAuthenticated, user } = useSelector((state) => state.user);

  const [showMenuCreate, setShowMenuCreate] = useState(false);
  const [newMenuCategory, setNewMenuCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToAdd, setItemToAdd] = useState({ category: "", foodItemId: "" });
  const [availableItems, setAvailableItems] = useState([]);
  const [creatingFood, setCreatingFood] = useState(false);

  const [newFood, setNewFood] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
    imageUrl: "",
  });

  useEffect(() => {
    dispatch(getMenus(id));
    dispatch(getRestaurants());
  }, [dispatch, id]);

  // fetch food items
  const fetchItems = async () => {
    try {
      const { data } = await axios.get(`/api/v1/eats/items/${id}`);
      setAvailableItems(data.data);
    } catch (err) {
      console.error("failed to load items", err);
    }
  };

  // FIXED createMenu
  const submitMenuCreation = async (e) => {
    e.preventDefault();
    if (!newMenuCategory) return;

    const result = await dispatch(
      createMenu({ restaurantId: id, category: newMenuCategory })
    );

    if (createMenu.fulfilled.match(result)) {
      dispatch(getMenus(id)); // optional refresh
      setShowMenuCreate(false);
      setNewMenuCategory("");
    }
  };

  const submitNewFood = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newFood,
        price: parseFloat(newFood.price) || 0,
        stock: parseInt(newFood.stock) || 0,
        restaurant: id,
      };

      const { data } = await axios.post("/api/v1/eats/item", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const created = data.data;

      setAvailableItems((prev) => [...prev, created]);
      setItemToAdd({ ...itemToAdd, foodItemId: created._id });

      setCreatingFood(false);
      setNewFood({
        name: "",
        price: "",
        description: "",
        stock: "",
        imageUrl: "",
      });

      return created;
    } catch (err) {
      console.error("unable to create food item", err);
      alert(err.response?.data?.message || err.message);
      return null;
    }
  };

  return (
    <div>
      {loading ? (
        <p>Loading menus...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : menus && menus.length > 0 ? (
        menus.map((menu) => {
          const deleteMenu = async () => {
            if (!window.confirm("Delete this menu category?")) return;
            try {
              await axios.delete(
                `/api/v1/eats/stores/${id}/menus/${menu._id}`,
                {
                  withCredentials: true,
                }
              );
              dispatch(getMenus(id));
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || "Unable to delete menu");
            }
          };

          return (
            <div key={menu._id}>
              <div className="d-flex align-items-center">
                <h2 className="mr-2">{menu.category}</h2>

                {isAuthenticated && user && user.role === "admin" && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setItemToAdd({
                          category: menu.category,
                          foodItemId: "",
                        });
                        fetchItems();
                        setShowAddModal(true);
                      }}
                    >
                      + item
                    </button>

                    <button
                      className="btn btn-sm btn-danger ml-2"
                      onClick={deleteMenu}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              <hr />

              {menu.items && menu.items.length > 0 ? (
                <div className="row">
                  {menu.items.map((fooditem) => (
                    <Fooditem
                      key={fooditem._id}
                      fooditem={fooditem}
                      restaurant={id}
                    />
                  ))}
                </div>
              ) : (
                <p>No menus available</p>
              )}
            </div>
          );
        })
      ) : (
        <p> No menus Available</p>
      )}

      {/* add menu button */}
      {isAuthenticated && user && user.role === "admin" && (
        <div className="my-3">
          <button
            className="btn btn-primary"
            onClick={() => setShowMenuCreate(true)}
          >
            + Add Menu
          </button>
        </div>
      )}

      {/* create menu modal */}
      {showMenuCreate && (
        <div className="create-modal">
          <div className="create-content">
            <h3>Create Menu Category</h3>

            <form onSubmit={submitMenuCreation}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={newMenuCategory}
                  onChange={(e) => setNewMenuCategory(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Create
              </button>

              <button
                className="btn btn-secondary ml-2"
                type="button"
                onClick={() => setShowMenuCreate(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* add item modal */}
      {showAddModal && (
        <div className="create-modal">
          <div className="create-content">
            <h3>Add Food Item</h3>

            {addError && <p className="text-danger">{addError}</p>}

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const created = await submitNewFood(e);

                if (created && created._id) {
                  dispatch(
                    addItemToMenu({
                      menuId,
                      category: itemToAdd.category,
                      foodItemId: created._id,
                      restaurantId: id,
                    })
                  ).then(() => {
                    dispatch(getMenus(id)); // optional refresh
                    setShowAddModal(false);
                  });
                }
              }}
            >
              <div className="form-group">
                <label>Menu Category</label>

                <select
                  value={itemToAdd.category}
                  onChange={(e) =>
                    setItemToAdd({
                      ...itemToAdd,
                      category: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select</option>
                  {menus.map((m) => (
                    <option key={m._id} value={m.category}>
                      {m.category}
                    </option>
                  ))}
                </select>
              </div>

              <h5 className="mt-3">Create New Food Item</h5>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Name"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood({ ...newFood, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group d-flex align-items-center">
                <input
                  type="number"
                  placeholder="Price"
                  value={newFood.price}
                  onChange={(e) =>
                    setNewFood({ ...newFood, price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group d-flex align-items-center">
                <input
                  type="text"
                  placeholder="Description"
                  value={newFood.description}
                  onChange={(e) =>
                    setNewFood({
                      ...newFood,
                      description: e.target.value,
                    })
                  }
                  required
                />

                <button
                  type="button"
                  className="btn btn-sm btn-info ml-2"
                  onClick={async () => {
                    if (!newFood.name) return alert("Enter name first");

                    try {
                      const { data } = await axios.post(
                        "/api/v1/ai/generate-food-ai",
                        {
                          name: newFood.name,
                          category: itemToAdd.category || "",
                          spiceLevel: "Medium",
                          price: newFood.price || 0,
                        },
                        { withCredentials: true }
                      );

                      setNewFood({
                        ...newFood,
                        description: data.data.description,
                      });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  AI desc
                </button>
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Stock"
                  value={newFood.stock}
                  onChange={(e) =>
                    setNewFood({ ...newFood, stock: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newFood.imageUrl}
                  onChange={(e) =>
                    setNewFood({ ...newFood, imageUrl: e.target.value })
                  }
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Add
              </button>

              <button
                className="btn btn-secondary ml-2"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;