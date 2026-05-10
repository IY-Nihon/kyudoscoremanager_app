#!/bin/bash
set -e

# Configuration
BUNDLE_ID="com.nitidaikouka.RecordAppExpo"
APP_NAME="RecordAppExpo"
APP_PATH=$1

if [ -z "$APP_PATH" ]; then
    echo "Usage: $0 <path_to_app_bundle>"
    exit 1
fi

echo "--- [STEP 1] Setup Simulator ---"
# Find the latest iOS runtime identifier (robust match)
RUNTIME=$(xcrun simctl list runtimes | grep -m 1 "iOS" | awk '{print $NF}')
if [ -z "$RUNTIME" ]; then
    # Fallback to generic version string if NF doesn't work
    RUNTIME=$(xcrun simctl list runtimes | grep -m 1 "iOS" | sed -E 's/.*(com\.apple\..*)/\1/')
fi
echo "Found Runtime: $RUNTIME"

# Create a fresh device
DEVICE_ID=$(xcrun simctl create "AIDebugDevice" "iPhone 15" "$RUNTIME")
echo "Created Device ID: $DEVICE_ID"

# Boot the device
echo "Booting simulator..."
xcrun simctl boot "$DEVICE_ID"
# Wait for the device to be booted
xcrun simctl bootstatus "$DEVICE_ID"

echo "--- [STEP 2] Install and Prepare ---"
echo "Installing app from: $APP_PATH"
xcrun simctl install "$DEVICE_ID" "$APP_PATH"

# Setup log capture in background
echo "Starting log recording..."
# Listen for EVERYTHING related to our bundle or react or system aborts
xcrun simctl spawn "$DEVICE_ID" log stream --level debug --predicate "senderImagePath CONTAINS '$APP_NAME' OR subsystem CONTAINS 'com.nitidaikouka' OR subsystem CONTAINS 'com.facebook.react' OR subsystem CONTAINS 'com.apple.runtime.abort' OR process == '$APP_NAME'" > simulator_run.log &
LOG_PID=$!

echo "--- [STEP 3] Launch and Monitor ---"
echo "Launching app: $BUNDLE_ID"
set +e
xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID"
LAUNCH_RESULT=$?
set -e

echo "Waiting for execution (20 seconds)..."
# Give it some time to crash or initialize
sleep 20

echo "Stopping log recording (PID: $LOG_PID)..."
kill $LOG_PID || true

echo "--- [STEP 4] Collect Evidence ---"
echo "Collecting system-level crash reports..."
mkdir -p crash_reports
# Search for .ips files created in the last 5 minutes
find ~/Library/Logs/DiagnosticReports -name "${APP_NAME}*.ips" -mmin -5 -exec cp {} crash_reports/ \;

# Export final status
if [ -d "crash_reports" ] && [ "$(ls -A crash_reports)" ]; then
    echo "CRASH DETECTED: Files found in crash_reports/"
else
    echo "No crash reports found in system diagnostics."
fi

echo "--- [STEP 4.5] Export Recent System Logs (Backup) ---"
# Sometimes log stream misses early crash data, log show is more reliable for historical data
xcrun simctl spawn "$DEVICE_ID" log show --last 2m --predicate "subsystem CONTAINS 'com.nitidaikouka' OR subsystem CONTAINS 'com.facebook.react' OR process == '$APP_NAME'" > simulator_system_logs_recent.log

echo "--- [STEP 5] Summary ---"
echo "Simulator Log Tail (last 50 lines):"
tail -n 50 simulator_run.log

echo "Debug process finished."
