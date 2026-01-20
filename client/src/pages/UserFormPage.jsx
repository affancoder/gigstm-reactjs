import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TOKEN_KEY = "jwt_token";
const API_URL = import.meta.env.VITE_API_URL || "/api";

function UserFormPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [progress, setProgress] = useState(0);

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    mobile: "",
    jobRole: "",
    gender: "",
    dob: "",
    aadhaar: "",
    pan: "",
    country: "in",
    state: "",
    city: "",
    address1: "",
    address2: "",
    pincode: "",
    about: "",
  });

  const [experience, setExperience] = useState({
    experienceYears: "",
    experienceMonths: "",
    employmentType: "",
    occupation: "",
    jobRequirement: "",
    heardAbout: "",
    interestType: "",
  });

  const [kyc, setKyc] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [files, setFiles] = useState({
    profileImage: null,
    aadhaarFile: null,
    panFile: null,
    resumeFile: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCardUpload: null,
    passbookUpload: null,
  });

  const [existingFiles, setExistingFiles] = useState({
    profileImage: false,
    aadhaarFile: false,
    panFile: false,
    resumeFile: false,
    aadhaarFront: false,
    aadhaarBack: false,
    panCardUpload: false,
    passbookUpload: false,
  });

  const REQUIRED_FIELDS = [
    // Personal
    { name: "name", section: "personal", label: "Name" },
    { name: "email", section: "personal", label: "Email" },
    { name: "mobile", section: "personal", label: "Mobile" },
    { name: "jobRole", section: "personal", label: "Job Role" },
    { name: "gender", section: "personal", label: "Gender" },
    { name: "dob", section: "personal", label: "Date of Birth" },
    { name: "aadhaar", section: "personal", label: "Aadhaar Number" },
    { name: "pan", section: "personal", label: "PAN Number" },
    { name: "country", section: "personal", label: "Country" },
    { name: "state", section: "personal", label: "State" },
    { name: "city", section: "personal", label: "City" },
    { name: "address1", section: "personal", label: "Address Line 1" },
    { name: "pincode", section: "personal", label: "Pincode" },
    // Files (Personal/Docs)
    { name: "profileImage", section: "files", label: "Profile Image" },
    { name: "aadhaarFile", section: "files", label: "Aadhaar File" },
    { name: "panFile", section: "files", label: "PAN File" },
    { name: "resumeFile", section: "files", label: "Resume" },
    // Experience
    { name: "experienceYears", section: "experience", label: "Experience Years" },
    { name: "experienceMonths", section: "experience", label: "Experience Months" },
    { name: "employmentType", section: "experience", label: "Employment Type" },
    { name: "occupation", section: "experience", label: "Occupation" },
    { name: "jobRequirement", section: "experience", label: "Job Requirement" },
    { name: "heardAbout", section: "experience", label: "Heard About" },
    { name: "interestType", section: "experience", label: "Interest Type" },
    // KYC
    { name: "bankName", section: "kyc", label: "Bank Name" },
    { name: "accountNumber", section: "kyc", label: "Account Number" },
    { name: "ifscCode", section: "kyc", label: "IFSC Code" },
    // KYC Files
    { name: "aadhaarFront", section: "kyc-files", label: "Aadhaar Front" },
    { name: "aadhaarBack", section: "kyc-files", label: "Aadhaar Back" },
    { name: "panCardUpload", section: "kyc-files", label: "PAN Card (KYC)" },
    { name: "passbookUpload", section: "kyc-files", label: "Passbook" },
  ];

  const token = typeof window !== "undefined"
    ? localStorage.getItem(TOKEN_KEY)
    : null;

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
  };

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonal((prev) => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setExperience((prev) => ({ ...prev, [name]: value }));
  };

  const handleKycChange = (e) => {
    const { name, value } = e.target;
    setKyc((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, file) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    let filled = 0;

    REQUIRED_FIELDS.forEach((field) => {
      let isFilled = false;

      if (field.section === "personal") {
        const val = personal[field.name];
        if (val && String(val).trim() !== "") isFilled = true;
      } else if (field.section === "experience") {
        const val = experience[field.name];
        if (val && String(val).trim() !== "") isFilled = true;
      } else if (field.section === "kyc") {
        const val = kyc[field.name];
        if (val && String(val).trim() !== "") isFilled = true;
      } else if (field.section === "files") {
        if (files[field.name] || existingFiles[field.name]) isFilled = true;
      } else if (field.section === "kyc-files") {
        if (files[field.name] || existingFiles[field.name]) isFilled = true;
      }

      if (isFilled) filled++;
    });

    const percentage = REQUIRED_FIELDS.length
      ? Math.round((filled / REQUIRED_FIELDS.length) * 100)
      : 0;
    setProgress(percentage);
  }, [personal, experience, kyc, files, existingFiles]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/user/me/combined`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const payload = data.data || {};

        if (payload.profile) {
          const p = payload.profile;
          setPersonal((prev) => ({
            ...prev,
            name: p.name || "",
            email: p.email || payload.user?.email || "",
            mobile: p.mobile || "",
            jobRole: p.jobRole || "",
            gender: p.gender || "",
            dob: p.dob ? p.dob.slice(0, 10) : "",
            aadhaar: p.aadhaar || "",
            pan: p.pan || "",
            country: p.country || "in",
            state: p.state || "",
            city: p.city || "",
            address1: p.address1 || "",
            address2: p.address2 || "",
            pincode: p.pincode || "",
            about: p.about || "",
          }));

          setExistingFiles((prev) => ({
            ...prev,
            profileImage: !!p.profileImage,
            aadhaarFile: !!p.aadhaarFile,
            panFile: !!p.panFile,
            resumeFile: !!p.resumeFile,
          }));
        } else if (payload.user) {
          setPersonal((prev) => ({
            ...prev,
            name: payload.user.name || "",
            email: payload.user.email || "",
          }));
        }

        if (payload.experience) {
          const e = payload.experience;
          setExperience({
            experienceYears: e.experienceYears || "",
            experienceMonths: e.experienceMonths || "",
            employmentType: e.employmentType || "",
            occupation: e.occupation || "",
            jobRequirement: e.jobRequirement || "",
            heardAbout: e.heardAbout || "",
            interestType: e.interestType || "",
          });
        }

        if (payload.kyc) {
          const k = payload.kyc;
          setKyc({
            bankName: k.bankName || "",
            accountNumber: k.accountNumber || "",
            ifscCode: k.ifscCode || "",
          });

          setExistingFiles((prev) => ({
            ...prev,
            aadhaarFront: !!k.aadhaarFront,
            aadhaarBack: !!k.aadhaarBack,
            panCardUpload: !!k.panCardUpload,
            passbookUpload: !!k.passbookUpload,
          }));
        }
      } catch {
        showMessage("Unable to load profile data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, token]);

  const submitPersonal = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Authentication token missing. Please login.", "error");
      return;
    }

    const missing = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (field.section === "personal") {
        const val = personal[field.name];
        if (!val || String(val).trim() === "") {
          missing.push(field.label);
        }
      } else if (field.section === "files") {
        if (!files[field.name] && !existingFiles[field.name]) {
          missing.push(field.label);
        }
      }
    });

    if (missing.length > 0) {
      showMessage(
        `Please fill the following required fields: ${missing.join(", ")}`,
        "error"
      );
      return;
    }

    try {
      setLoading(true);
        const formData = new FormData();

      Object.entries(personal).forEach(([key, value]) => {
        formData.append(key === "jobRole" ? "job-role" : key, value);
      });

      if (files.profileImage) {
        formData.append("profile-image", files.profileImage);
      }
      if (files.aadhaarFile) {
        formData.append("aadhaar-file", files.aadhaarFile);
      }
      if (files.panFile) {
        formData.append("pan-file", files.panFile);
      }
      if (files.resumeFile) {
        formData.append("resume-file", files.resumeFile);
      }

      const res = await fetch(`${API_URL}/user/profile`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save profile.");
      }

      showMessage("Profile saved successfully.");
    } catch (err) {
      showMessage(
        err.message || "An error occurred while saving profile.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitExperience = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Authentication token missing. Please login.", "error");
      return;
    }

    const missing = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (field.section === "experience") {
        const val = experience[field.name];
        if (!val || String(val).trim() === "") {
          missing.push(field.label);
        }
      }
    });

    if (missing.length > 0) {
      showMessage(
        `Please fill the following required fields: ${missing.join(", ")}`,
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(experience).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const res = await fetch(`${API_URL}/user/experience`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save experience.");
      }

      showMessage("Experience saved successfully.");
    } catch (err) {
      showMessage(
        err.message || "An error occurred while saving experience.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitKyc = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Authentication token missing. Please login.", "error");
      return;
    }

    const missing = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (field.section === "kyc") {
        const val = kyc[field.name];
        if (!val || String(val).trim() === "") {
          missing.push(field.label);
        }
      } else if (field.section === "kyc-files") {
        if (!files[field.name] && !existingFiles[field.name]) {
          missing.push(field.label);
        }
      }
    });

    if (missing.length > 0) {
      showMessage(
        `Please fill the following required fields: ${missing.join(", ")}`,
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(kyc).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (files.aadhaarFront) {
        formData.append("aadhaarFront", files.aadhaarFront);
      }
      if (files.aadhaarBack) {
        formData.append("aadhaarBack", files.aadhaarBack);
      }
      if (files.panCardUpload) {
        formData.append("panCardUpload", files.panCardUpload);
      }
      if (files.passbookUpload) {
        formData.append("passbookUpload", files.passbookUpload);
      }

      const res = await fetch(`${API_URL}/user/kyc`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save KYC.");
      }

      showMessage("KYC details saved successfully.");
    } catch (err) {
      showMessage(
        err.message || "An error occurred while saving KYC details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!token) {
      showMessage("Authentication token missing. Please login again.", "error");
      return;
    }

    if (!passwords.currentPassword || !passwords.newPassword) {
      showMessage("Please fill in all password fields.", "error");
      return;
    }

    if (passwords.newPassword.length < 6) {
      showMessage("New password must be at least 6 characters long.", "error");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage("New passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      showMessage(
        "Password changed successfully. Please login again.",
        "success"
      );
      localStorage.removeItem(TOKEN_KEY);
      navigate("/login");
    } catch (err) {
      showMessage(
        err.message || "An error occurred while changing password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const disableUnlock = progress < 100;

  return (
    <div className="userform-page">
      {loading && (
        <div className="loader-overlay">
          <div className="loader-circle" />
          <p className="loader-text">Please wait...</p>
        </div>
      )}

      <header className="site-header">
        <div className="brand-logo">
          <button
            type="button"
            className="logo-button"
            onClick={() => navigate("/")}
          >
            <span className="logo-text">GigsTm</span>
          </button>
        </div>
        <div className="header-btns">
          <button
            type="button"
            className="btn btn-transparent"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="userform-main">
        <div className="userform-layout">
          <aside className="userform-sidebar">
            <div className="user-avatar">
              <div className="avatar-circle">U</div>
            </div>
            <div className="user-progress">
              <div className="progress-label">Profile Completion</div>
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">{progress}% complete</div>
              <button
                type="button"
                className="unlock-button"
                disabled={disableUnlock}
                onClick={() => navigate("/job-categories.html")}
              >
                {disableUnlock ? "Locked" : "Unlocked - Job Categories"}
              </button>
            </div>
          </aside>

          <section className="userform-content">
            {message && (
              <div
                className={
                  messageType === "success"
                    ? "banner banner-success"
                    : "banner banner-error"
                }
              >
                {message}
              </div>
            )}

            <div className="tabs">
              <button
                type="button"
                className={
                  activeTab === "personal" ? "tab active" : "tab"
                }
                onClick={() => setActiveTab("personal")}
              >
                Personal Details
              </button>
              <button
                type="button"
                className={
                  activeTab === "experience" ? "tab active" : "tab"
                }
                onClick={() => setActiveTab("experience")}
              >
                Experience
              </button>
              <button
                type="button"
                className={activeTab === "kyc" ? "tab active" : "tab"}
                onClick={() => setActiveTab("kyc")}
              >
                KYC Details
              </button>
              <button
                type="button"
                className={
                  activeTab === "password" ? "tab active" : "tab"
                }
                onClick={() => setActiveTab("password")}
              >
                Change Password
              </button>
            </div>

            {activeTab === "personal" && (
              <form className="form" onSubmit={submitPersonal}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      id="name"
                      name="name"
                      value={personal.name}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={personal.email}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="mobile">Your Mobile</label>
                    <input
                      id="mobile"
                      name="mobile"
                      value={personal.mobile}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="jobRole">Job Role</label>
                    <input
                      id="jobRole"
                      name="jobRole"
                      value={personal.jobRole}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={personal.gender}
                      onChange={handlePersonalChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={personal.dob}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-image">Profile Image</label>
                    <input
                      type="file"
                      id="profile-image"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(
                          "profileImage",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadhaar">Aadhaar Card No.</label>
                    <input
                      id="aadhaar"
                      name="aadhaar"
                      value={personal.aadhaar}
                      onChange={handlePersonalChange}
                      maxLength={12}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pan">Pan Card No.</label>
                    <input
                      id="pan"
                      name="pan"
                      value={personal.pan}
                      onChange={handlePersonalChange}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadhaar-file">Upload Aadhaar</label>
                    <input
                      type="file"
                      id="aadhaar-file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "aadhaarFile",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pan-file">Upload Pan</label>
                    <input
                      type="file"
                      id="pan-file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "panFile",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      id="country"
                      name="country"
                      value={personal.country}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      name="state"
                      value={personal.state}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      name="city"
                      value={personal.city}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address1">Address Line 1</label>
                    <input
                      id="address1"
                      name="address1"
                      value={personal.address1}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address2">Address Line 2</label>
                    <input
                      id="address2"
                      name="address2"
                      value={personal.address2}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pincode">Pincode</label>
                    <input
                      id="pincode"
                      name="pincode"
                      value={personal.pincode}
                      onChange={handlePersonalChange}
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="resume-file">Resume</label>
                    <input
                      type="file"
                      id="resume-file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        handleFileChange(
                          "resumeFile",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="about">About</label>
                    <textarea
                      id="about"
                      name="about"
                      value={personal.about}
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Personal Details
                </button>
              </form>
            )}

            {activeTab === "experience" && (
              <form className="form" onSubmit={submitExperience}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experienceYears">Experience Years</label>
                    <input
                      id="experienceYears"
                      name="experienceYears"
                      value={experience.experienceYears}
                      onChange={handleExperienceChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="experienceMonths">Experience Months</label>
                    <input
                      id="experienceMonths"
                      name="experienceMonths"
                      value={experience.experienceMonths}
                      onChange={handleExperienceChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="employmentType">Employment Type</label>
                    <input
                      id="employmentType"
                      name="employmentType"
                      value={experience.employmentType}
                      onChange={handleExperienceChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="occupation">Occupation</label>
                    <input
                      id="occupation"
                      name="occupation"
                      value={experience.occupation}
                      onChange={handleExperienceChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jobRequirement">Job Requirement</label>
                    <input
                      id="jobRequirement"
                      name="jobRequirement"
                      value={experience.jobRequirement}
                      onChange={handleExperienceChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="heardAbout">
                      Where did you hear about us?
                    </label>
                    <input
                      id="heardAbout"
                      name="heardAbout"
                      value={experience.heardAbout}
                      onChange={handleExperienceChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="interestType">Interest Type</label>
                    <input
                      id="interestType"
                      name="interestType"
                      value={experience.interestType}
                      onChange={handleExperienceChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Experience
                </button>
              </form>
            )}

            {activeTab === "kyc" && (
              <form className="form" onSubmit={submitKyc}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <input
                      id="bankName"
                      name="bankName"
                      value={kyc.bankName}
                      onChange={handleKycChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="accountNumber">Account Number</label>
                    <input
                      id="accountNumber"
                      name="accountNumber"
                      value={kyc.accountNumber}
                      onChange={handleKycChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ifscCode">IFSC Code</label>
                    <input
                      id="ifscCode"
                      name="ifscCode"
                      value={kyc.ifscCode}
                      onChange={handleKycChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadhaarFront">Aadhaar Front</label>
                    <input
                      type="file"
                      id="aadhaarFront"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "aadhaarFront",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="aadhaarBack">Aadhaar Back</label>
                    <input
                      type="file"
                      id="aadhaarBack"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "aadhaarBack",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="panCardUpload">Pan Card</label>
                    <input
                      type="file"
                      id="panCardUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "panCardUpload",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="passbookUpload">Passbook or Cheque</label>
                    <input
                      type="file"
                      id="passbookUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(
                          "passbookUpload",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save KYC Details
                </button>
              </form>
            )}

            {activeTab === "password" && (
              <form className="form" onSubmit={submitPasswordChange}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>Copyright © 2025 gigstm.com | All rights reserved.</p>
      </footer>
    </div>
  );
}

export default UserFormPage;
