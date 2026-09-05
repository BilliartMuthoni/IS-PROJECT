from fastapi import FastAPI

#create a web server
app = FastAPI()

@app.get("/")
def message():
    print("Server running")
    return("Server running")
