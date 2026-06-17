import os
import configparser

# Obtener la ruta absoluta del archivo config.py
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construir la ruta absoluta hacia server.config
config_path = os.path.join(current_dir, "../server.config")

# Leer el archivo de configuración
config = configparser.ConfigParser()
config.read(config_path)

