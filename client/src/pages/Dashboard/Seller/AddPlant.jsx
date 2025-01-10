import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imageUpload } from "../../../api/utils";
import useAuth from "../../../hooks/useAuth";
import { useState } from "react";

import toast from "react-hot-toast";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

const AddPlant = () => {
  const { user } = useAuth();
  const [uploadText, setUploadText] = useState("Image Upload");
  const [loading, setLoading] = useState(false);
  // setLoading(true);
  // console.log(user);
  const axiosSecure = useAxiosSecure();

  // handle form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    //set loading true before fetch
    setLoading(true);
    const form = e.target;
    const name = form.name.value;
    const price = parseFloat(form.price.value);
    const quantity = form.quantity.value;
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
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
    console.log(plant);
  };

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        handleSubmit={handleSubmit}
        uploadText={uploadText}
        setUploadText={setUploadText}
        loading={loading}
      />
    </div>
  );
};

export default AddPlant;
