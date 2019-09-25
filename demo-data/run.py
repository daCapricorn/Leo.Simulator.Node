import cv2
# import pytesseract

import base64

# 灰度，二值化
def _get_dynamic_binary_image(img_name):
    im = cv2.imread(img_name)
    im = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    # th1 = cv2.adaptiveThreshold(im, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 1)

    return image_to_base64(im)

def image_to_base64(img):
    image = cv2.imencode('.jpg',img)[1]
    image_code = str(base64.b64encode(image))[2:-1]
 
    return image_code

#去除边框
def clear_border(img):
    h, w = img.shape[:2]
    for y in range(0, w):
        for x in range(0, h):
            if y < 2 or y > w - 2:
                img[x, y] = 255
            if x < 2 or x > h - 2:
                img[x, y] = 255
    return img,h,w




def show(img):
    cv2.namedWindow("Image")
    cv2.imshow("image", img)
    cv2.waitKey(0)
    cv2.destroyAllWindow()


if __name__ == '__main__':
    img = './test.jpg'
    im = _get_dynamic_binary_image(img)
    # Im, h, w = clear_border(im)
    # im =interference_line(Im, h, w)
    # IM = interference_point(im,img)

    print(im)
    # text = pytesseract.image_to_string(IM, lang='eng')
    # print(text)
    # image=show(im)