import React, { useState, useEffect, useRef } from "react";
import NotificationSystem from "react-notification-system";
import { style } from "../../variables/Variables.jsx";
import placeholder from "../../assets/images/placeholder.png";
import "./Form.css";
import { Helmet } from "react-helmet";
import { getAge } from "../../utils/GetAge.js";
import { Input } from "../Input/Input.jsx";
import { BASE_URL } from "../../constants/baseUrl.js";

const Form = () => {
  const newForm = {
    name: "",
    relationship: "",
    age: "",
  };

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    age: "",
    avatar: "",
    birth_date: "",
    familyMembers: [newForm],
  });

  const [loading, setLoading] = useState(false);

  const btn = useRef();
  const notification = useRef();

  useEffect(() => {
    if (loading) {
      btn.current.textContent = "Loading...";
      btn.current.style.opacity = "0.5";
      btn.current.style.pointerEvents = "none";
      btn.current.style.boxShadow = "none";
    } else {
      btn.current.textContent = "Submit";
      btn.current.style.opacity = "unset";
      btn.current.style.pointerEvents = "unset";
      btn.current.style.boxShadow = "unset";
    }
  }, [loading]);

  const addNotification = (
    level = "success",
    message,
    className = "pe-7s-check"
  ) => {
    notification.current.addNotification({
      title: <span data-notify="icon" className={className} />,
      message: <div>{message}</div>,
      level: level,
      position: "tr",
    });
  };

  const submitData = async (data) => {
    try {
      const response = await fetch(BASE_URL + "/e-collection/submit", {
        method: "POST",
        body: data,
      });
      return response;
    } catch (err) {
      return addNotification(
        "error",
        "Oops, An error while processing this request",
        "pe-7s-info"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      firstname,
      lastname,
      email,
      age,
      avatar,
      birth_date,
      familyMembers,
    } = form;
    if (
      (firstname && lastname && email && age && avatar && birth_date) === ""
    ) {
      addNotification("error", "All fields are required", "pe-7s-info");
      return;
    }

    if (!validateForm(familyMembers)) {
      return addNotification(
        "error",
        "Please complete all fields on previous family member forms",
        "pe-7s-info"
      );
    }

    const actualAge = getAge(birth_date);

    if (!(email.match(/([@])/) && email.match(/([.])/))) {
      addNotification("error", "Please enter a valid email", "pe-7s-info");
      return;
    }

    if (
      new Date(birth_date).setHours(0, 0, 0, 0) >=
      new Date().setHours(0, 0, 0, 0)
    ) {
      addNotification("error", "Age must be in the past", "pe-7s-info");
      return;
    }

    if (+age !== actualAge) {
      addNotification(
        "error",
        "Provided age and date of birth do not match",
        "pe-7s-info"
      );
      return;
    }

    if (actualAge < 18 || actualAge > 65) {
      addNotification(
        "error",
        "We apologize but this application is strictly for aged 18 - 65",
        "pe-7s-info"
      );
      return;
    }
    const formData = new FormData();
    formData.append("firstname", firstname);
    formData.append("lastname", lastname);
    formData.append("email", email);
    formData.append("age", age);
    formData.append("avatar", avatar);
    formData.append("birth_date", birth_date);

    for (let i = 0; i < familyMembers.length; i++) {
      formData.append(`familyMembers[${i}][name]`, familyMembers[i].name);
      formData.append(`familyMembers[${i}][age]`, familyMembers[i].age);
      formData.append(
        `familyMembers[${i}][relationship]`,
        familyMembers[i].relationship
      );
    }

    setLoading(true);
    
    const response = await submitData(formData);

    if (response.status) {

      setLoading(false);

      setForm({
        firstname: "",
        lastname: "",
        email: "",
        age: "",
        avatar: "",
        birth_date: "",
        familyMembers: [newForm],

      });

      addNotification(undefined, "Awesome !, submission received.", undefined);

    } else {

      setLoading(false);
      addNotification("error", response.message, "pe-7s-info");
    }
  };

  const onChange = (e) => {
    e.persist();
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];

    if (!file) return; // If user launched the picker and did not make a selection, return here to prevent errors

    // validate post size
    if (file.size > 1000000) {
      addNotification(
        "error",
        "Image too large, please choose an image that is not greater than 1MB",
        "pe-7s-info"
      );
      return;
    }

    // validate mime type
    const types = ["image/png", "image/jpeg", "image/gif"];

    if (types.every((type) => file.type !== type)) {
      addNotification(
        "error",
        `'${file.type}' is not a supported format`,
        "pe-7s-info"
      );
      return;
    }

    setForm((form) => ({ ...form, avatar: file }));
  };

  // We are working with dynamic forms for the family members portion, this logical flow makes that possible

  /**
   * Begin dynamic forms logical flow and dependencies
   */

  const textFields = [
    {
      name: "name",
      type: "text",
      label: "Name",
    },
    {
      name: "relationship",
      type: "test",
      label: "Relationship",
    },
    {
      name: "age",
      type: "number",
      label: "Age",
    },
  ];

  // This valis the form fields for the family members section

  const validateForm = (forms) => {
    // is it a form (object) or forms (array) ? - Array.isArray
    // has every field been filled by the user ?  - loop through every form and check for empty fields
    return Array.isArray(forms)
      ? forms.filter(
          (item) => Object.values(item).filter((val) => !val).length > 0
        ).length < 1
      : Object.values(forms).filter((val) => !val).length < 1;
  };

  const addNewForm = (e) => {
    e.preventDefault();
    if (!validateForm(form.familyMembers))
      return addNotification(
        "error",
        "Please complete all fields on previous family member forms",
        "pe-7s-info"
      );
    const createdForm = { ...newForm }; // immutability is priceless. keep our original form the same to prevent pass by reference gotchas
    setForm((form) => ({
      ...form,
      familyMembers: [...form.familyMembers, createdForm],
    }));
  };

  const removeForm = (index) => {
    const updatedForms = form.familyMembers.filter((_, i) => i !== index);

    setForm((form) => ({ ...form, familyMembers: updatedForms }));
  };

  const handleDynamicFormsChange = (event, index) => {
    event.persist();
    const updatedForms = form.familyMembers.map((form, i) => {
      return i === index
        ? {
            ...form,
            [event.target.name]: event.target.value,
          }
        : form;
    });
    setForm((form) => ({ ...form, familyMembers: updatedForms }));
  };

  /**
   * End dynamic forms logical flow and dependencies
   */

  return (
    <div className="log-in w-full h-auto sm:h-screen  md:h-screen xl:h-auto flex items-center bg-white md:bg-gray-400">
      <Helmet>
        <title>Techinnover | Data Collection Form</title>
      </Helmet>
      <NotificationSystem ref={notification} style={style} />
      <div className="w-9/12 rounded sm:px-2 md:p-10 bg-white my-4 block mx-auto">
        <p className="mx-auto block tracking-tight leading-tight text-center text-teal-600 my-6">
          e-Collection Form
        </p>
        <form className="w-auto h-64 md:h-auto" onSubmit={handleSubmit}>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div
              className="content mx-auto pb-3 flex justify-center"
              style={{ position: "relative" }}
            >
              <label
                htmlFor="file-upload"
                className="custom-file-upload text-teal-600"
              >
                <div className="md:flex-shrink-0 mb-2">
                  <img
                    className="rounded-lg md:w-56"
                    src={
                      form.avatar
                        ? URL.createObjectURL(form.avatar) // display uploaded file
                        : placeholder
                    }
                    width="448"
                    height="299"
                    alt="User's avatar"
                  />
                </div>
                <i className="fa fa-cloud-upload text-teal-600"></i>{" "}
                {form.avatar
                  ? "Awesome ! Change Avatar"
                  : "Click to Upload An Avatar"}
              </label>
              <input id="file-upload" type="file" onChange={handleFile} />
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <Input
              divClass="w-full md:w-1/3 px-3"
              labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
              label="First Name"
              inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              type="text"
              name="firstname"
              placeholder="Jane"
              value={form.firstname}
              onChange={onChange}
            />
            <Input
              divClass="w-full md:w-1/3 px-3"
              labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
              label="Last Name"
              inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              type="text"
              name="lastname"
              placeholder="Doe"
              value={form.lastname}
              onChange={onChange}
            />
            <Input
              divClass="w-full md:w-1/3 px-3"
              labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
              label="Age"
              inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              type="number"
              min="18"
              max="65"
              name="age"
              placeholder=""
              value={form.age}
              onChange={onChange}
            />
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <Input
              divClass="w-full md:w-1/2 px-3"
              labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
              label="Email Address"
              inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              type="email"
              name="email"
              placeholder="johndoe@gmail.com"
              value={form.email}
              onChange={onChange}
            />
            <Input
              divClass="w-full md:w-1/2 px-3"
              labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
              label="Date"
              inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              type="date"
              name="birth_date"
              value={form.birth_date}
              onChange={onChange}
            />
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <h3 className="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2">
                Family Members
              </h3>
            </div>
            <div className="w-full md:w-2/3 px-3 mb-6 md:mb-0 flex justify-end items-center outline-none">
              <button
                className="outline-none border-none focus:outline-none active:outline-none text-teal-700 hover:text-teal-500"
                onClick={addNewForm}
              >
                <i className="fa fa-plus" aria-hidden="true"></i> Add A Family
                Member
              </button>
            </div>
          </div>
          {form.familyMembers.map((item, index) => {
            return (
              <div key={index}>
                <div className="flex flex-wrap -mx-3 mb-6">
                  <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                    <h3 className="block tracking-wide text-gray-700 text-sm font-light mb-2">
                      {`Member: ${index + 1}`}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap -mx-3 mb-2">
                  {textFields.map(({ name, label, type }, idx) => {
                    return (
                      <Input
                        key={idx}
                        divClass="w-full md:w-1/3 px-3 mb-6 md:mb-0"
                        labelClass="block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2"
                        label={label}
                        inputClass="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        type={type}
                        name={name}
                        value={item[name]}
                        onChange={(event) =>
                          handleDynamicFormsChange(event, index)
                        }
                      />
                    );
                  })}
                </div>
                {form.familyMembers.length > 1 && (
                  <div className="w-full px-3 mb-6 md:mb-0 flex justify-end items-center outline-none">
                    <button
                      className="outline-none border-none focus:outline-none active:outline-none text-red-700 hover:text-red-500"
                      onClick={() => removeForm(index)}
                    >
                      <i className="fa fa-times" aria-hidden="true"></i> Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div className="my-3">
            <button
              className="bg-blue-500 hover:bg-blue-700 w-40 text-white block mx-auto mt-16 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              ref={btn}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { Form };
