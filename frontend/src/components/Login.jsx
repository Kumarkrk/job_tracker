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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/user/login", { email, password });

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      window.dispatchEvent(new Event("auth:changed"));
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to log in right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-card" component="section">
      <Box className="auth-card-heading">
        <span className="auth-eyebrow">Welcome back</span>
        <Typography component="h1" className="auth-title">
          Continue your job search
        </Typography>
        <Typography className="auth-subtitle">
          Sign in to see your applications, progress, and next steps.
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
            id="login-email"
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
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            inputProps={{ "aria-label": "Password" }}
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
              "Log in to dashboard"
            )}
          </Button>
        </Stack>
      </Box>

      <Typography className="auth-switch">
        New to JobTracker? <Link to="/signup">Create an account</Link>
      </Typography>
    </Box>
  );
}
