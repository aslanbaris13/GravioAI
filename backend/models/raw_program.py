# farklı kurumlardan gelen veriler dağınık ve farklı formatlarda olabilir. Bu nedenle, verileri normalize etmek ve ortak bir formatta işlemek önemlidir. Aşağıda, farklı kurumlardan gelen verileri normalize etmek için bir Python sınıfı örneği verilmiştir.
# Bu dağınık verileri doğrudan support programa aktarmadan önce burada tutuyoruz
# daha temiz ve düzenli hale getirmek için
try:
	from pydantic import BaseModel
except Exception:  # fallback if pydantic is not installed (e.g., in editors)
	# Provide a minimal BaseModel fallback to avoid import errors during static analysis
	class BaseModel:  # type: ignore
		def __init__(self, *args, **kwargs):
			for k, v in kwargs.items():
				setattr(self, k, v)

from typing import List, Optional, Dict, Any


class RawProgram(BaseModel):
	source:str                  #veriyi sağlayan kurumun adı
	title:str                   #programın başlığı
	url:str                     #programın web sayfasının url'si
	raw_data:Dict[str, Any]     #programla ilgili ham veri

