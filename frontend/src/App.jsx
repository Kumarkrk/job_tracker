import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { TOKEN_KEY } from "./api";
import "./App.css";

const Login = lazy(() => import("./components/Login"));
const SignUp = lazy(() => import("./components/Signup"));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.default })));

function useWaterBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const pointer = { x: -500, y: -500, previousX: -500, previousY: -500 };
    const ripples = [];
    let width = 0;
    let height = 0;
    let frameId;
    let animationTime = 0;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handlePointerMove = (event) => {
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const distance = Math.hypot(
        pointer.x - pointer.previousX,
        pointer.y - pointer.previousY,
      );

      if (distance > 3) {
        ripples.push({
          x: pointer.x,
          y: pointer.y,
          radius: 4,
          opacity: 0.45,
        });
      }

      if (ripples.length > 24) {
        ripples.shift();
      }
    };

    const animate = () => {
      animationTime += 0.012;
      context.fillStyle = "#07111f";
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalAlpha = 0.08;
      context.strokeStyle = "#5d8dff";

      for (let y = 20; y < height; y += 46) {
        context.beginPath();

        for (let x = 0; x <= width; x += 12) {
          const wave = Math.sin(x * 0.012 + y * 0.018 + animationTime) * 3;
          const pointY = y + wave;
          if (x === 0) context.moveTo(x, pointY);
          else context.lineTo(x, pointY);
        }

        context.stroke();
      }

      context.restore();

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.radius += 2.2;
        ripple.opacity -= 0.012;

        if (ripple.opacity <= 0) {
          ripples.splice(index, 1);
          continue;
        }

        context.beginPath();
        context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(103, 161, 255, ${ripple.opacity})`;
        context.lineWidth = 1.5;
        context.stroke();
      }

      if (pointer.x > -100) {
        const glow = context.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          170,
        );
        glow.addColorStop(0, "rgba(77, 139, 255, 0.13)");
        glow.addColorStop(1, "rgba(77, 139, 255, 0)");
        context.fillStyle = glow;
        context.fillRect(
          pointer.x - 170,
          pointer.y - 170,
          340,
          340,
        );
      }

      frameId = window.requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, []);

  return canvasRef;
}

function Brand({ compact = false }) {
  return (
    <Link className={`brand ${compact ? "brand-compact" : ""}`} to="/">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>JobTracker</span>
    </Link>
  );
}

function AuthLayout({ children }) {
  const canvasRef = useWaterBackground();
  const location = useLocation();

  return (
    <div className="auth-page">
      <canvas ref={canvasRef} className="water-canvas" aria-hidden="true" />
      <nav className="auth-navbar">
        <Brand />
        <div className="auth-nav-links" aria-label="Authentication navigation">
          <Link
            className={location.pathname === "/login" ? "active" : ""}
            to="/login"
          >
            Log in
          </Link>
          <Link
            className={location.pathname === "/signup" ? "active" : ""}
            to="/signup"
          >
            Create account
          </Link>
        </div>
      </nav>
      <main className="auth-content">{children}</main>
      <p className="auth-footer">Your job search, organized in one place.</p>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  useEffect(() => {
    const updateAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem(TOKEN_KEY)));
    };

    window.addEventListener("auth:expired", updateAuthState);
    window.addEventListener("auth:changed", updateAuthState);

    return () => {
      window.removeEventListener("auth:expired", updateAuthState);
      window.removeEventListener("auth:changed", updateAuthState);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <Suspense
                fallback={
                  <div className="auth-route-loader" role="status">
                    <span aria-label="Loading login" />
                  </div>
                }
              >
                <Login />
              </Suspense>
            </AuthLayout>
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <Suspense
                fallback={
                  <div className="auth-route-loader" role="status">
                    <span aria-label="Loading signup" />
                  </div>
                }
              >
                <SignUp />
              </Suspense>
            </AuthLayout>
          )
        }
      />
      <Route
        path="/dashboard/*"
        element={
          isAuthenticated ? (
            <Suspense
              fallback={
                <div className="dashboard-route-loader" role="status">
                  <span aria-label="Loading dashboard" />
                </div>
              }
            >
              <Dashboard />
            </Suspense>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
