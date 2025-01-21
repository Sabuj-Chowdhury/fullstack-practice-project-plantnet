import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imageUpload } from "../../../api/utils";
import useAuth from "../../../hooks/useAuth";
import { useState } from "react";

import toast from "react-hot-toast";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const AddPlant = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (e) => {
    const image = e.target.files[0];
    if (image) {
      setSelectedImage(URL.createObjectURL(image));
    }
  };

  // handle form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    //set loading true before fetch
    setLoading(true);
    const form = e.target;
    const name = form.name.value;
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value);
    const description = form.description.value;
    const category = form.category.value;
    const image = form.image.files[0];

    //imageBB API to get imageUrl
    const imageUrl = await imageUpload(image);

    //seller info
    const seller = {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    };

    const plant = {
      name,
      description,
      category,
      price,
      quantity,
      image: imageUrl,
      seller,
    };
    try {
      // api call to save plant data in db
      await axiosSecure.post(`/plant`, plant);
      toast.success("Data added Successfully!");
      navigate("/dashboard/my-inventory");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        handleSubmit={handleSubmit}
        handleImageChange={handleImageChange}
        loading={loading}
        selectedImage={selectedImage}
      />
    </div>
  );
};

export default AddPlant;
