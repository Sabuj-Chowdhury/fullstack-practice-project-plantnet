/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import Button from "../Shared/Button/Button";

import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  // console.log(refetch);
  const { user } = useAuth();
  const { name, category, quantity, price, _id, seller } = plant;
  const axiosSecure = useAxiosSecure();
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);
  const navigate = useNavigate();

  const [order, setOrder] = useState({
    plantId: _id,
    price: totalPrice,
    quantity: totalQuantity,
    address: "",
    seller: seller?.email,
    status: "pending",
  });

  const handleQuantity = (value) => {
    if (value > quantity) {
      setTotalQuantity(quantity);
      return toast.error("Quantity exceeds available stock");
    }
    if (value < 0) {
      setTotalQuantity(1);
      return toast.error("Quantity can not be less then 1");
    }
    setTotalQuantity(value);
    setTotalPrice(value * price); // Total Price Calculation

    setOrder((pre) => {
      return { ...pre, price: value * price, quantity: value };
    });
  };
  const orderInfo = {
    ...order,
    customer: {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    },
  };
  // submit
  const handlePurchase = async () => {
    //api to call save order info in db

    try {
      // save the order info in DB
      await axiosSecure.post("/orders", orderInfo);
      // decrease the quantity
      await axiosSecure.patch(`/plants/quantity/${_id}`, {
        quantityNum: totalQuantity,
        status: "decrease",
      });

      toast.success("order Placed!");
      refetch();
      navigate("/dashboard/my-orders");
    } catch (err) {
      console.log(err);
    } finally {
      closeModal();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category} </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {price}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {quantity}
                  </p>
                </div>
                {/* Quantity */}
                <div className="mt-2">
                  <div className="space-x-2 text-sm">
                    <label htmlFor="quantity" className=" text-gray-600">
                      Quantity :
                    </label>
                    <input
                      value={totalQuantity}
                      onChange={(e) => handleQuantity(parseInt(e.target.value))}
                      className=" p-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                      name="quantity"
                      id="quantity"
                      type="number"
                      placeholder="Available quantity"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2">
                  {/* Address */}
                  <div className="space-x-2 text-sm">
                    <label htmlFor="Address" className=" text-gray-600">
                      Address :
                    </label>
                    <input
                      className=" p-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                      onChange={(e) =>
                        setOrder((pre) => {
                          return { ...pre, address: e.target.value };
                        })
                      }
                      name="address"
                      id="address"
                      type="text"
                      placeholder="Shipping address"
                      required
                    />
                  </div>
                </div>
                {/* button */}
                <div className="mt-2">
                  <Button
                    onClick={handlePurchase}
                    label={`Pay $${totalPrice}`}
                  ></Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;

PurchaseModal.propTypes = {
  plant: PropTypes.object,
};
