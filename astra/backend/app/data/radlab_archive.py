"""ARCHIVED RadLab sample: one real day of ISS dose-rate readings, used ONLY when NASA cannot be reached
and nothing has been cached yet.

How these numbers were obtained (so anyone can check them): the project author asked the public RadLab API
(https://visualization.osdr.nasa.gov/radlab/api/) for the readings of the ISS instruments DosTel1 and DosTel2
on 2022-04-01 (2,389 readings), then averaged them per hour (UTC). Nothing here is estimated or invented.
Unit: absorbed dose rate in micrograys per hour (uGy/h), as stated in the RadLab documentation.
"""

RADLAB_HOME = "https://visualization.osdr.nasa.gov/radlab/"

ARCHIVE_DAY = "2022-04-01"

# (hour of day UTC, number of readings, average absorbed dose rate in uGy/h)
ARCHIVE_HOURLY = [
    (0, 91, 5.2079), (1, 92, 6.2330), (2, 121, 32.0033), (3, 95, 13.1744),
    (4, 138, 171.9622), (5, 132, 66.4048), (6, 91, 3.9521), (7, 91, 3.9133),
    (8, 93, 3.9065), (9, 93, 4.4850), (10, 90, 5.0837), (11, 92, 4.0587),
    (12, 130, 73.5792), (13, 131, 81.3207), (14, 92, 3.9032), (15, 92, 5.4548),
    (16, 93, 5.0992), (17, 91, 4.3157), (18, 92, 6.8167), (19, 92, 6.2250),
    (20, 92, 4.8569), (21, 92, 6.1872), (22, 92, 7.0438), (23, 81, 6.0383),
]

# Whole-day figures from the same 2,389 readings.
ARCHIVE_SUMMARY = {"readings": 2389, "average": 27.7496, "minimum": 1.4256, "maximum": 731.333}
