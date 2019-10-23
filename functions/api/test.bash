  GNU nano 2.9.3                                                                                                     run.bash
#!/bin/bash
array=(starbucks.com paypal.com shipt.com uber.com hackerone.com semrush.com)
for item in ${array[*]}
do
    echo "AMASS PASSIVE MODE"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_1_t4.txt -d ${item} -timeout 2
    echo "AMASS PASSIVE MODE WITH WORDLIST"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_5_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 2
    echo "AMASS PASSIVE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_8_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 2
done
    echo "Completed Passive mode successfully"
git add .
git commit -m "temp1"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/temp.git
for item in ${array[*]}
do
    echo "AMASS ACTIVE MODE"
    amass enum -active -o /home/hemachand/temp/amass_${itemt_2_t4}.txt -d ${item} -timeout 2
    echo "AMASS ACTIVE MODE WITH WORDLIST"
    amass enum -active -o /home/hemachand/temp/amass_${item}_4_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 2
    echo "AMASS ACTIVE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -active -o /home/hemachand/temp/amass_${item}_7_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 2
done
    echo "Completed Active mode successfully"
git add .
git commit -m "temp2"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/temp.git
for item in ${array[*]}
do
    echo "AMASS BRUTE MODE"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_3_t4.txt -d ${item} -timeout 30
    echo "AMASS BRUTE MODE MITH WORDLIST"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_6_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 30
    echo "AMASS BRUTE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_9_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 30
done
    echo "Completed Brute mode successfully"
git add .
git commit -m "temp3"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/temp.git




