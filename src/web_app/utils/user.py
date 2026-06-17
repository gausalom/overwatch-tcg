class User:

    is_authenticated = False
    is_active = False
    is_anonymous = True
    id = None

    def __init__(self, user_info):
        self.id = user_info['id_player']
        self.username = user_info['player_name']
        self.password = user_info['player_password']
        self.team = user_info['team']
        self.is_admin = user_info['is_admin']
        self.is_active = True
        self.is_authenticated = True
        self.is_anonymous = True

    def is_authenticated(self):
        return self.is_authenticated

    def is_active(self):
        return self.is_active

    def is_anonymous(self):
        return self.is_anonymous

    def get_id(self):
        return self.id