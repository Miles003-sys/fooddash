import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Please enter a valid email";
    if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim()))
      e.phone = "Please enter a valid phone number";
    if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    navigate("/");
  };

  const inputClass = "w-full border rounded-lg px-4 py-2 bg-white";
  const Field = ({ label, name, type = "text" }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        className={inputClass}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Field({ label: "Full name", name: "name" })}
          {Field({ label: "Email", name: "email", type: "email" })}
          {Field({ label: "Phone number", name: "phone" })}
          {Field({ label: "Password", name: "password", type: "password" })}
          {Field({
            label: "Confirm password",
            name: "confirm",
            type: "password",
          })}
          {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-red-500 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
