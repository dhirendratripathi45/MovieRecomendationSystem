from mongoengine import connect
import os

try:
    print("Attempting to connect...")
    connect(
        db='movie_recomendation_system',
        host='localhost',
        port=27017
    )
    print("Connected successfully!")
    from models import Genre
    print("Querying Genre...")
    print(Genre.objects.first())
except Exception as e:
    import traceback
    with open('error.log', 'w') as f:
        f.write(str(e) + '\n')
        traceback.print_exc(file=f)
