import csv
import requests
from decouple import config

# Variables for request
AID = config("AID")
API_TOKEN = config("API_TOKEN")
URL = f"https://sandbox.piano.io/api/v3/publisher/user/list?api_token={API_TOKEN}&aid={AID}"

# Http Request
request = requests.get(url=URL)
request = request.json()
api_emails = list()
api_users = list()

for user in request["users"]:
    api_emails.append(user["email"])
    api_users.append(user)

# Save files into variables and read values
file_a = csv.reader(open("A.csv"))
file_b = csv.reader(open("B.csv"))

usersA = list()
usersB = list()

for row in file_a:
    user = {"user_id": row[0], "email": row[1]}
    usersA.append(user)
usersA.pop(0)

for row in file_b:
    user = {
        "user_id": row[0],
        "first_name": row[1],
        "last_name": row[2],
    }
    usersB.append(user)
usersB.pop(0)

# Merge values into usersA
for user in usersB:

    try:
        index = [
            x["user_id"] for x in usersA
        ].index(user["user_id"])
    except ValueError:
        index = -1

    usersA[index]["first_name"] = user[
        "first_name"
    ]
    usersA[index]["last_name"] = user["last_name"]

# Create output data variable, filtering if a user is already in database
output_data = list()
for user in usersA:
    output_data.append(list(user.values()))


for user in output_data:
    if user[1] in api_emails:
        try:
            index = [
                x["email"] for x in api_users
            ].index(user[1])
        except ValueError:
            index = -1
        if index != -1:
            user[0] = api_users[index]["uid"]


# Write the output file
output_filename = "C.csv"
with open(
    output_filename, "w", newline=""
) as file:
    csvwriter = csv.writer(file)
    csvwriter.writerow(
        [
            "user_id",
            "email",
            "first_name",
            "last_name",
        ]
    )
    csvwriter.writerows(output_data)
    print("File successfully created")
