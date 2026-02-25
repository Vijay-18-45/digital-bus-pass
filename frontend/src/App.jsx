import { Routes, Route } from "react-router-dom";
import EmailOtp from "./components/EmailOtp";
import Home from "./components/home";
import AboveSSCForm from "./components/AboveSSCForm";
import BelowSSCForm from "./components/BelowSSCForm";
import CitizenForm from "./components/CitizenForm";
import GovEmpApplicationForm from "./components/GovEmpApplicationForm";
import JournalistForm from "./components/JournalistForm";
import NGOApplicationForm from "./components/NGOApplicationForm";
import NonGovEmpApplicationForm from "./components/NonGovEmpApplicationForm";
import TraceDetails from "./components/TraceDetails";
import UpdateDetails from "./components/UpdateDetails";
import Payment from "./components/Payment";
import MyPass from "./components/MyPass";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<EmailOtp />} />
      <Route path="/home" element={<Home />} />
      <Route path="/above-ssc" element={<AboveSSCForm />} />
      <Route path="/below-ssc" element={<BelowSSCForm />} />
      <Route path="/citizen-form" element={<CitizenForm />} />
      <Route path="/gov-emp-form" element={<GovEmpApplicationForm />} />
      <Route path="/journalist-form" element={<JournalistForm />} />
      <Route path="/ngo-form" element={<NGOApplicationForm />} />
      <Route path="/non-gov-emp-form" element={<NonGovEmpApplicationForm />} />
      <Route path="/trace-details" element={<TraceDetails />} />
      <Route path="/update-details" element={<UpdateDetails />} />
      <Route path="/payment" element={<Payment mode="new" />} />
      <Route path="/renewal" element={<Payment mode="renewal" />} />
      <Route path="/my-pass" element={<MyPass />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;