"""
C++ Forecasting Engine Bridge with Seamless Python DSA Fallback.
Provides reliable inter-process communication with compiled C++ binary,
and automatically falls back to pure Python DSA implementation if binary is absent.
"""

import os
import sys
import json
import subprocess
import time
from typing import List, Dict, Any

CPP_BINARY_PATH = os.path.join(os.path.dirname(__file__), "..", "cpp_engine", "forecast_engine")

def is_cpp_binary_available() -> bool:
    """Checks if the compiled C++ forecasting binary exists and is executable."""
    return os.path.isfile(CPP_BINARY_PATH) and os.access(CPP_BINARY_PATH, os.X_OK)

def execute_cpp_or_fallback(points: List[Dict[str, Any]], horizon_days: int = 30) -> Dict[str, Any]:
    """
    Attempts to run C++ forecasting engine.
    If binary is unavailable or returns an error, cleanly falls back to Python DSA implementation.
    """
    t0 = time.time()
    
    if is_cpp_binary_available():
        try:
            payload = json.dumps({"points": points, "horizon_days": horizon_days})
            process = subprocess.run(
                [CPP_BINARY_PATH, "--json", payload],
                capture_output=True,
                text=True,
                timeout=5
            )
            if process.returncode == 0 and process.stdout:
                parsed = json.loads(process.stdout)
                duration_ms = round((time.time() - t0) * 1000.0, 2)
                parsed["engine_type"] = "cpp_dsa_engine"
                parsed["engine_status"] = "Native C++ Binary (Compiled DSA Core)"
                parsed["execution_time_ms"] = duration_ms
                return parsed
        except Exception as e:
            # Print non-fatal warning and fall back
            sys.stderr.write(f"[C++ Bridge] C++ execution failed: {e}. Falling back to Python DSA engine.\n")

    # Python DSA Fallback
    from ..ml_engine import MLForecaster
    forecaster = MLForecaster(points)
    res = forecaster.forecast(algorithm="holt_winters", horizon_days=horizon_days)
    res["engine_type"] = "python_dsa_fallback"
    res["engine_status"] = "Python DSA Fallback Engine (Native Binary not compiled)"
    res["cpp_available"] = False
    return res
