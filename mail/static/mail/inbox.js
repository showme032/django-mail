document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => {
        load_mailbox('inbox');
    })
    document.querySelector('#sent').addEventListener('click', () => {
        load_mailbox('sent');
    })
    document.querySelector('#archived').addEventListener('click', () => {
        load_mailbox('archive');
    })
    document.querySelector('#compose').addEventListener('click', () =>{
        compose_email();
    })
    
    // By default, load the inbox
    load_mailbox('inbox');
});


function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#view-email').style.display = 'none';
    document.querySelector('#emails-list').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';


    // Submit data when email is composed
    document.querySelector('#compose-form').onsubmit = () => {
        // Post data via request
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
        })
        load_mailbox('sent');

        // Prevent doing other stuff when submiting
        return false;
    }
}


function load_mailbox(mailbox) {
    // Show the mailbox, clear previous HTML, and hide other views
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'block';

    // Show the mailbox name on top
    document.querySelector('#emails-view').innerHTML = `<div class="fs-3 fw-medium">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</div>`;

    // Add Bootstrap List group for showing emails
    const emails_list = document.createElement('ul')
    emails_list.id = 'emails-list'
    emails_list.className = 'list-group shadow-sm'
    document.querySelector('#emails-view').append(emails_list);

    // Produce email list
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        console.log(emails)
        //get each email, and its values
        for (mail of emails) {
            const sender = mail.sender;
            let subject = 'No Subject';
            if (mail.subject.length > 0) {
                subject = mail.subject;
            }
            const timestamp = mail.timestamp;
            const id = mail.id;
            
            // Create HTML element for each email
            let link = document.createElement('li');
            if (mail.read == false) {
                link.className = 'list-group-item border border-primary list-group-item-action justify-content-between b-1';
            } else {
                link.className = 'list-group-item list-group-item-action list-group-item-light justify-content-between b-1';
            }
            link.innerHTML = `<div class="m-1">
                                  <div class="fs-5 fw-medium">${subject}</div>
                                  <div class="fw-medium">Sender: ${sender}</div>
                                  <small>${timestamp}</small>
                              <div>`;

            // Add event listener to that element, view email when clicked
            link.addEventListener('click', function() {
                view_email(id);
            })

            // Append created email list to DOM
            document.querySelector('#emails-list').append(link);  
        }
    })

}


function view_email(id) {
    // Show single email view and hide others
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'block';
    document.querySelector('#emails-list').style.display = 'none';
    document.querySelector('#archive').style.display = 'none';
    
    // Show email after fetching data
    fetch(`emails/${id}`)
        .then(response => response.json ())
        .then(email =>{
            // Mark as read if opening the first time
            if (email.read == false) {
                fetch(`emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true
                    })
                });
            }
            
            // Archive/Unarchive button, depending on current status
            if ( email.sender != document.querySelector('#email-user').innerHTML) {
                document.querySelector('#archive').style.display = 'block';
                if (email.archived == false) {
                    document.querySelector('#archive').innerHTML = 'Archive email';
                } else {
                    document.querySelector('#archive').innerHTML = 'Unarchive';
                }
            }

            // Fill in the fields when viewing an email
            document.querySelector('#sender').innerHTML = `<b>Sender:</b> ${email.sender}`;
            document.querySelector('#recipients').innerHTML = `<b>Recipients:</b> `;
            for (person of email.recipients) {
                document.querySelector('#recipients').append(`${person}, `);
            }
            document.querySelector('#timestamp').innerHTML = email.timestamp;
            if (email.subject.length > 0) {
                document.querySelector('#title').innerHTML = `Subject: ${email.subject}`;
            } else {
                document.querySelector('#title').innerHTML = 'No Subject';
            }
            document.querySelector('#body').innerHTML = email.body;

            // Toggle archive status when button pressed, load inbox    
            document.querySelector('#archive').addEventListener('click', () => {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: !email.archived
                    })
                })
                .then(function() {
                    location.reload();
                })
            })

            // Redirect to compose view when replying an email
            document.querySelector('#reply').addEventListener('click', () => {
                compose_email()

                // Pre-fill some lines
                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
                document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n\n   ${email.body}\n  `;
            })
        })
}