echo "AMASS PASSIVE MODE"
amass enum -passive -o /home/hemachand/temp/amass_starbucks.com_1_t4.txt -d starbucks.com -timeout 4
echo "AMASS PASSIVE MODE WITH WORDLIST"
amass enum -passive -o /home/hemachand/temp/amass_starbucks.com_5_t4.txt -w /home/hemachand/temp/words1.txt -d starbucks.com -timeout 4
echo "AMASS PASSIVE MODE WITH WORDLIST AND ALTERATIONS"
amass enum -passive -o /home/hemachand/temp/amass_starbucks.com_8_t4.txt -aw /home/hemachand/temp/words1.txt -d starbucks.com -timeout 4
echo "AMASS ACTIVE MODE"
amass enum -active -o /home/hemachand/temp/amass_starbucks.comt_2_t4.txt -d starbucks.com -timeout 4
echo "AMASS ACTIVE MODE WITH WORDLIST"
amass enum -active -o /home/hemachand/temp/amass_starbucks.com_4_t4.txt -w /home/hemachand/temp/words1.txt -d starbucks.com -timeout 4
echo "AMASS ACTIVE MODE WITH WORDLIST AND ALTERATIONS"
amass enum -active -o /home/hemachand/temp/amass_starbucks.com_7_t4.txt -aw /home/hemachand/temp/words1.txt -d starbucks.com -timeout 4
echo "AMASS BRUTE MODE"
amass enum -brute -o /home/hemachand/temp/amass_starbucks.com_3_t4.txt -d starbucks.com -timeout 10
echo "AMASS BRUTE MODE MITH WORDLIST"
amass enum -brute -o /home/hemachand/temp/amass_starbucks.com_6_t4.txt -w /home/hemachand/temp/words1.txt -d starbucks.com -timeout 10
echo "AMASS BRUTE MODE WITH WORDLIST AND ALTERATIONS"
amass enum -brute -o /home/hemachand/temp/amass_starbucks.com_9_t4.txt -aw /home/hemachand/temp/words1.txt -d starbucks.com -timeout 10


  
