#!/bin/bash
# žiju life — Knowledge Pipeline
# Spouštět každé ráno přes launchd (macOS cron)

AUTH="Authorization: Bearer w4mytDi3qs1oTn5S4CClvxG/dsY7CwWOxbeV0DnZEEI="
BASE="https://ziju.life/api"
LOG="$HOME/.ziju-pipeline.log"

echo "=== $(date) ===" >> "$LOG"

# 1. Fetch all RSS sources
echo "[1/3] Fetching sources..." >> "$LOG"
curl -s -H "$AUTH" "$BASE/pipeline/fetch-sources" >> "$LOG" 2>&1
echo "" >> "$LOG"

# 2. Process articles in batches until none remain
echo "[2/3] Processing articles..." >> "$LOG"
for i in $(seq 1 20); do
  RESULT=$(curl -s -H "$AUTH" "$BASE/pipeline/process-articles")
  echo "  Batch $i: $RESULT" >> "$LOG"
  REMAINING=$(echo "$RESULT" | grep -o '"remaining":[0-9]*' | grep -o '[0-9]*')
  if [ "$REMAINING" = "0" ] || [ -z "$REMAINING" ]; then
    break
  fi
  sleep 2
done

# 3. Send Slack brief
echo "[3/3] Sending brief..." >> "$LOG"
curl -s -H "$AUTH" "$BASE/cron/daily-brief" >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "Done." >> "$LOG"
