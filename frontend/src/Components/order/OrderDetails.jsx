import React, { Fragment, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";

import Loader from "../layout/Loader";
import { getOrderDetails } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";


const OrderDetails = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  //  order state
  const { loading, error, order } = useSelector((state) => state.order);


  // fetch data
  useEffect(() => {
    dispatch(getOrderDetails(id));
    
  }, [dispatch, id]);

  // toast error
  useEffect(() => {
    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // safe destructuring
  const {
    _id,
    deliveryInfo = {},
    orderItems = [],
    paymentInfo = {},
    user = {},
    finalTotal,
    orderStatus,
    
  } = order || {};



  // delivery address
  const deliveryDetails = deliveryInfo
    ? `${deliveryInfo.address || ""}, ${deliveryInfo.city || ""}, ${
        deliveryInfo.postalCode || ""
      }, ${deliveryInfo.country || ""}`
    : "";

  // payment status
  const isPaid = paymentInfo?.status === "paid";

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <div className="row d-flex justify-content-between orderdetails">
            <div className="col-12 col-lg-8 mt-1 order-details">
              <h1 className="my-5">Order # {_id}</h1>


              {/* Delivery Info */}
              <h4 className="mb-4">Delivery Info</h4>
              <p>
                <b>Name:</b> {user?.name || "N/A"}
              </p>
              <p>
                <b>Phone:</b> {deliveryInfo?.phoneNo || "N/A"}
              </p>
              <p className="mb-4">
                <b>Address:</b> {deliveryDetails || "N/A"}
              </p>

              <p>
                <b>Amount:</b>{" "}
                <FontAwesomeIcon icon={faIndianRupeeSign} size="xs" />
                {finalTotal || 0}
              </p>

              <hr />

              {/* Payment */}
              <h4 className="my-4">
                Payment :
                <span className={isPaid ? "greenColor" : "redColor"}>
                  <b>{isPaid ? " PAID" : " NOT PAID"}</b>
                </span>
              </h4>

              {/* Order Status */}
              <h4 className="my-4">
                Order Status :
                <span
                  className={
                    orderStatus?.includes("Delivered")
                      ? "greenColor"
                      : "redColor"
                  }
                >
                  <b>{orderStatus || "Pending"}</b>
                </span>
              </h4>

              {/* Order Items */}
              <h4 className="my-4">Order Items:</h4>
              <hr />

              <div className="cart-item my-1">
                {orderItems.length > 0 ? (
                  orderItems.map((item) => (
                    <div key={item._id} className="row my-5">
                      <div className="col-4 col-lg-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          height="45"
                          width="65"
                        />
                      </div>

                      <div className="col-5 col-lg-5">
                        <Link to="#">{item.name}</Link>
                      </div>

                      <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                        <p>
                          <FontAwesomeIcon
                            icon={faIndianRupeeSign}
                            size="xs"
                          />
                          {item.price}
                        </p>
                      </div>

                      <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                        <p>{item.quantity} Item(s)</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No items found</p>
                )}
              </div>

              <hr />
            </div>
          </div>
        </Fragment>
      )}
    </>
  );
};

export default OrderDetails;