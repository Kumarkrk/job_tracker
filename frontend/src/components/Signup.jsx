import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import api, { getErrorMessage, TOKEN_KEY } from "../api";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("The passwords you entered do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/user/register", { email, password });

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      window.dispatchEvent(new Event("auth:changed"));
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create your account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-card" component="section">
      <Box className="auth-card-heading">
        <span className="auth-eyebrow">Get started</span>
        <Typography component="h1" className="auth-title">
          Build your application tracker
        </Typography>
        <Typography className="auth-subtitle">
          Create an account and keep every opportunity organized.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="auth-alert">
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.2}>
          <TextField
            id="signup-email"
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoFocus
            required
            fullWidth
            inputProps={{ "aria-label": "Email address" }}
          />
          <TextField
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            helperText="Use at least 6 characters"
            required
            inputProps={{ minLength: 6, "aria-label": "Password" }}
            fullWidth
          />
          <TextField
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            fullWidth
            inputProps={{ "aria-label": "Confirm password" }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Create account"
            )}
          </Button>
        </Stack>
      </Box>

      <Typography className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </Typography>
    </Box>
  );
}
