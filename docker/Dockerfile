FROM rackspacedot/python37:latest

RUN pip install --upgrade pip
RUN pip install pytesseract
RUN pip install opencv-python
# RUN apt-get update
# RUN add-apt-repository ppa:alex-p/tesseract-ocr


WORKDIR /LEO


ADD ./python/run.py /LEO/run.py

