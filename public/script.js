document.getElementById('attendance-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const studentName = document.getElementById('student-name').value;

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentName })
        });

        const message = await response.text();
        alert(message);
    } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('Failed to submit attendance.');
    }
});