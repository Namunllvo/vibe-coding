document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.querySelector('.wheel');
    const spinButton = document.getElementById('spinButton');
    const numSectors = 10; // 돌림판 섹터 개수 (1부터 10까지)
    const anglePerSector = 360 / numSectors; // 각 섹터의 각도

    // 섹터 동적 생성
    for (let i = 0; i < numSectors; i++) {
        const sector = document.createElement('div');
        sector.classList.add('sector');
        sector.style.transform = `rotate(${i * anglePerSector}deg)`; // 각 섹터의 초기 회전 각도 설정

        const span = document.createElement('span');
        span.textContent = i + 1; // 1부터 10까지 숫자
        span.style.setProperty('--angle', `${-anglePerSector / 2}deg`); // 텍스트가 똑바로 보이도록 조정
        
        sector.appendChild(span);
        wheel.appendChild(sector);
    }

    let currentRotation = 0;

    spinButton.addEventListener('click', () => {
        spinButton.disabled = true; // 돌리는 동안 버튼 비활성화

        const spins = Math.floor(Math.random() * 5) + 5; // 최소 5바퀴 + 0~4바퀴 추가 회전
        const randomDegree = Math.floor(Math.random() * 360); // 0~359도 사이의 무작위 각도
        
        // 최종 회전 각도 계산: 현재 회전 + 추가 회전 + 무작위 각도
        // (현재 회전을 360의 배수로 맞춰서 정지 지점을 예측하기 어렵게 함)
        currentRotation += (360 * spins) + randomDegree; 
        
        wheel.style.transform = `rotate(${currentRotation}deg)`;

        // 회전 애니메이션 종료 후 버튼 다시 활성화
        // CSS transition duration과 맞춰야 합니다 (현재 4초)
        setTimeout(() => {
            spinButton.disabled = false;
            // 결과 표시 (옵션): 실제 섹터와 포인터 위치 계산 필요
            // 이 예제에서는 시각적인 회전만 구현합니다.
            console.log("돌림판 멈춤!");
        }, 4000); 
    });
});