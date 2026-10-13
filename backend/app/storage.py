import boto3
from botocore.client import Config
from .config import settings
import os

class SpacesStorage:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.SPACES_ENDPOINT,
            aws_access_key_id=settings.SPACES_KEY,
            aws_secret_access_key=settings.SPACES_SECRET,
            region_name=settings.SPACES_REGION,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.SPACES_BUCKET
    
    def upload_file(self, local_path, key):
        with open(local_path, 'rb') as f:
            self.client.upload_fileobj(f, self.bucket, key, ExtraArgs={'ACL': 'public-read'})
    
    def upload_directory(self, local_dir, prefix):
        for root, dirs, files in os.walk(local_dir):
            for file in files:
                local_path = os.path.join(root, file)
                relative_path = os.path.relpath(local_path, local_dir)
                key = f"{prefix}/{relative_path}".replace("\\", "/")
                self.upload_file(local_path, key)
    
    def get_public_url(self, key):
        return f"{settings.SPACES_ENDPOINT}/{self.bucket}/{key}"

storage = SpacesStorage()
