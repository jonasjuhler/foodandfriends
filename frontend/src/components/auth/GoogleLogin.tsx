import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

declare global {
  interface Window {
    google: any;
  }
}

const GoogleLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID", // Replace with actual client ID
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      await login(response.credential);
      // Always redirect to booking page after successful login
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login error (show toast, etc.)
    }
  };

  return (
    <div className="flex justify-center">
      <div id="google-signin-button"></div>
    </div>
  );
};

export default GoogleLogin;
