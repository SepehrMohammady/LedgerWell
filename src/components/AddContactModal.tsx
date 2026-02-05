import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Contact } from '../types';
import StorageService from '../utils/storage';
import { useTheme, Theme } from '../utils/theme';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editContact?: Contact | null;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  editContact 
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) {
      if (editContact) {
        setName(editContact.name);
        setDescription(editContact.description || '');
      } else {
        resetForm();
      }
    }
  }, [visible, editContact]);

  const resetForm = () => {
    setName('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('pleaseEnterContactName'));
      return;
    }

    try {
      if (editContact) {
        // Update existing contact
        const updatedContact: Contact = {
          ...editContact,
          name: name.trim(),
          description: description.trim() || undefined,
          updatedAt: new Date(),
        };

        await StorageService.saveContact(updatedContact);
        Alert.alert(t('success'), t('contactUpdated'));
      } else {
        // Create new contact
        const newContact: Contact = {
          id: Date.now().toString(),
          name: name.trim(),
          description: description.trim() || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await StorageService.saveContact(newContact);
        Alert.alert(t('success'), t('contactCreated'));
      }
      
      resetForm();
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
      Alert.alert(t('error'), t('contactActionFailed'));
    }
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {editContact ? t('editContact') : t('addContact')}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('contactName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('contactNamePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={100}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('contactDescription')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('contactDescriptionPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={2}
              maxLength={150}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Contacts List Modal for managing all contacts
interface ContactsListModalProps {
  visible: boolean;
  onClose: () => void;
  onContactsChanged?: () => void;
}

export const ContactsListModal: React.FC<ContactsListModalProps> = ({
  visible,
  onClose,
  onContactsChanged,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    try {
      const contactsData = await StorageService.getContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      t('confirm'),
      t('deleteContactConfirm', { name: contact.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteContact(contact.id);
              loadContacts();
              onContactsChanged?.();
              Alert.alert(t('success'), t('contactDeleted'));
            } catch (error) {
              console.error('Failed to delete contact:', error);
              Alert.alert(t('error'), t('contactDeleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setAddModalVisible(true);
  };

  const styles = createStyles(theme);

  const renderContactItem = ({ item }: { item: Contact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.contactDescription}>{item.description}</Text>
        )}
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditContact(item)}
        >
          <Ionicons name="pencil" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteContact(item)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('manageContacts')}</Text>
          <TouchableOpacity onPress={() => {
            setEditingContact(null);
            setAddModalVisible(true);
          }}>
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>{t('noContacts')}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingContact(null);
                setAddModalVisible(true);
              }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>{t('addContact')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}

        <AddContactModal
          visible={addModalVisible}
          onClose={() => {
            setAddModalVisible(false);
            setEditingContact(null);
          }}
          onSave={() => {
            loadContacts();
            onContactsChanged?.();
          }}
          editContact={editingContact}
        />
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  contactDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default AddContactModal;
