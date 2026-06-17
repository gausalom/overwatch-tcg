from web_app import app
from web_app.utils.config import config

if __name__ == '__main__':
    app.run(debug=config["Web"]["Debug"], host=config["Web"]["IpDirection"], port=config["Web"]["Port"])
