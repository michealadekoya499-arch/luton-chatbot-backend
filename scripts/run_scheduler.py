from apscheduler.schedulers.blocking import BlockingScheduler
from scripts.sync_results import sync_once

def main():
    sched = BlockingScheduler()
    sched.add_job(sync_once, "interval", minutes=5)
    print("✅ Auto-sync started (every 5 minutes). Press CTRL+C to stop.")
    sched.start()

if __name__ == "__main__":
    main()